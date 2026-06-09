from app.core import database
from app.core import database
from app.core import database
import logging
import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, Form, Request, BackgroundTasks, HTTPException, status
from fastapi.responses import Response, PlainTextResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User as UserModel
from app.models.message import Conversation as ConversationModel, Message as MessageModel
from app.models.faq import FAQCache as FAQCacheModel
from app.schemas.chatbot import WebQueryRequest, WebQueryResponse

from app.services.translation import translation_service
from app.services.nlp_engine import nlp_engine_service, HEALTH_RESPONSES
from app.services.twilio_client import twilio_client
from app.services.whatsapp_client import whatsapp_client
from uuid import UUID
from datetime import datetime

logger = logging.getLogger("app.api.v1.endpoints.chatbot")
router = APIRouter()

# Helper function to get query md5 hash
def get_query_hash(text: str) -> str:
    return hashlib.md5(text.strip().lower().encode("utf-8")).hexdigest()


async def process_chatbot_flow(
    user_id: str,
    original_text: str,
    channel: str,
    db: Session,
    to_phone: Optional[str] = None
):
    """Orchestrates translation, NLP, response translation, cache operations, and delivery.
    Runs asynchronously in the background.
    """
    try:
        # 1. Fetch User
        #logger.info(f"user_id = {user_id}")
        #logger.info(f"type(user_id) = {type(user_id)}")
        #print("DEBUG USER_ID:", user_id)
        #print("DEBUG TYPE:", type(user_id))
        
        user_uuid = UUID(str(user_id))

        user = (
            db.query(UserModel)
            .filter(UserModel.id == user_uuid)
            .first()
        )
        if not user:
            logger.error(f"User with ID {user_id} not found in background task.")
            return

        lang_pref = user.language_preference
        
        # 1. Auto-detect language using Unicode ranges
        import re
        if re.search(r"[\u0900-\u097F]", original_text):
            detected_lang = "hi"
        elif re.search(r"[\u0C00-\u0C7F]", original_text):
            detected_lang = "te"
        else:
            detected_lang = lang_pref

        # Sync language preference to user profile
        if detected_lang != user.language_preference:
            user.language_preference = detected_lang
            db.commit()

        query_hash = get_query_hash(original_text)

        # 2. Check FAQ Cache
        cached_faq = db.query(FAQCacheModel).filter(FAQCacheModel.query_hash == query_hash).first()
        if cached_faq:
            logger.info(f"FAQ Cache hit for hash {query_hash}")
            cached_faq.hits += 1
            db.commit()
            
            response_text = cached_faq.answer_text
            translated_query = cached_faq.translated_query
        else:
            # 3. Translate input to English (if not English already) for backup and RASA context
            if detected_lang != "en":
                translated_query = await translation_service.translate(original_text, detected_lang, "en")
            else:
                translated_query = original_text

            # 4. Check for language switch command
            lower_query = translated_query.lower()
            if "change language to" in lower_query or "switch language to" in lower_query or lower_query in ["hindi", "english", "telugu"]:
                new_lang = "en"
                if "hindi" in lower_query:
                    new_lang = "hi"
                elif "telugu" in lower_query:
                    new_lang = "te"
                
                user.language_preference = new_lang
                db.commit()
                
                response_text = f"Language preference updated to {new_lang}."
                if new_lang == "hi":
                    response_text = "आपकी भाषा प्राथमिकता हिंदी में अपडेट कर दी गई है।"
                elif new_lang == "te":
                    response_text = "మీ భాష ప్రాధాన్యత తెలుగుకు నవీకరించబడింది."
                
                detected_lang = new_lang
            else:
                # 5. Parse Intent via NLP Engine
                nlp_result = await nlp_engine_service.parse_and_respond(translated_query, original_text)
                intent = nlp_result.get("intent")
                english_response = nlp_result.get("response_text")

                # 6. Translate Response back to native language
                is_default_greeting = (
                    english_response == HEALTH_RESPONSES["default"]
                    or english_response == HEALTH_RESPONSES["greetings"]
                )
                
                should_translate = True
                if is_default_greeting:
                    help_keywords = ["help", "support", "assistant", "info", "मदद", "सहायता", "सपोर्ट", "సహాయం", "సపోర్ట్"]
                    user_requested_help = any(kw in original_text.lower() for kw in help_keywords)
                    should_translate = (intent == "greet" or user_requested_help)

                if detected_lang != "en" and should_translate:
                    response_text = await translation_service.translate(english_response, "en", detected_lang)
                else:
                    response_text = english_response

                # 7. Write to cache if intent is general and not user-specific
                if intent not in ["query_vaccination_schedule", "out_of_scope"]:
                    try:
                        new_cache = FAQCacheModel(
                            query_hash=query_hash,
                            original_query=original_text,
                            translated_query=translated_query,
                            resolved_intent=intent,
                            answer_text=response_text
                        )
                        db.add(new_cache)
                        db.commit()
                    except Exception as ce:
                        db.rollback()
                        logger.warning(f"Failed to cache query: {ce}")

        # 8. Save Conversation & Messages
        conversation = db.query(ConversationModel).filter(
            ConversationModel.user_id == user.id,
            ConversationModel.channel == channel
        ).order_by(ConversationModel.started_at.desc()).first()

        if not conversation:
            conversation = ConversationModel(user_id=user.id, channel=channel)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # Save incoming message
        incoming_msg = MessageModel(
            conversation_id=conversation.id,
            sender="user",
            original_text=original_text,
            translated_text=translated_query,
            language_code=lang_pref
        )
        db.add(incoming_msg)

        # Save outgoing response
        outgoing_msg = MessageModel(
            conversation_id=conversation.id,
            sender="bot",
            original_text=response_text,
            translated_text=response_text if lang_pref == "en" else None,
            language_code=lang_pref
        )
        db.add(outgoing_msg)
        db.commit()

        # 9. Deliver response message asynchronously
        if channel == "sms" and to_phone:
            twilio_client.send_sms(to_phone, response_text)
        elif channel == "whatsapp" and to_phone:
            if settings.WHATSAPP_API_TOKEN.startswith("mock"):
                # Use Twilio Whatsapp
                twilio_client.send_whatsapp(to_phone, response_text)
            else:
                # Use Meta WhatsApp Cloud API directly
                await whatsapp_client.send_message(to_phone, response_text)
                
        return response_text

    except Exception as e:
        logger.error(f"Error processing chatbot flow: {e}")
        db.rollback()


@router.post("/webhook")
def twilio_webhook(
    background_tasks: BackgroundTasks,
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db)
):
    """Twilio Webhook handler for incoming SMS/WhatsApp messages.
    Returns HTTP 200 OK immediately and handles NLP/Translations in background.
    """
    logger.info(f"Received Twilio Webhook message from {From}. Body: '{Body}'")
    
    # Determine channel type (whatsapp:+123 or +123)
    channel = "whatsapp" if From.startswith("whatsapp:") else "sms"
    
    # Check if user already exists
    user = db.query(UserModel).filter(UserModel.phone_number == From).first()
    if not user:
        # Auto-create user
        user = UserModel(
            phone_number=From,
            name=f"User {From[-4:]}",
            language_preference="en",
            status="active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Spawn background task to process logic
    background_tasks.add_task(
        process_chatbot_flow,
        user_id=user.id,
        original_text=Body,
        channel=channel,
        db=db,
        to_phone=From
    )

    # Return empty response to Twilio to avoid holding connection open
    return Response(content="<Response></Response>", media_type="application/xml")


@router.get("/whatsapp/webhook")
def verify_whatsapp_webhook(request: Request):
    """Meta WhatsApp Cloud API webhook challenge verification handler."""
    params = request.query_params
    mode = params.get("hub.mode")
    challenge = params.get("hub.challenge")
    verify_token = params.get("hub.verify_token")

    if mode and verify_token:
        if mode == "subscribe" and verify_token == settings.WHATSAPP_VERIFY_TOKEN:
            logger.info("WhatsApp Cloud API webhook successfully verified.")
            return PlainTextResponse(challenge)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Verify token mismatch"
            )
    return PlainTextResponse("WhatsApp Verification Endpoint")


@router.post("/whatsapp/webhook")
async def receive_whatsapp_message(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Meta WhatsApp Cloud API webhook messaging event listener."""
    try:
        body = await request.json()
        logger.info(f"Received Meta WhatsApp payload: {body}")
        
        # Extract message object from Meta payload JSON structure
        entry = body.get("entry", [])
        if not entry:
            return {"status": "ignored"}
        
        changes = entry[0].get("changes", [])
        if not changes:
            return {"status": "ignored"}
            
        value = changes[0].get("value", {})
        messages = value.get("messages", [])
        
        if messages:
            message_obj = messages[0]
            from_phone = message_obj.get("from")
            text_body = message_obj.get("text", {}).get("body", "")
            
            if from_phone and text_body:
                user = db.query(UserModel).filter(UserModel.phone_number == from_phone).first()
                if not user:
                    user = UserModel(
                        phone_number=from_phone,
                        name=f"User {from_phone[-4:]}",
                        language_preference="en",
                        status="active"
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)

                background_tasks.add_task(
                    process_chatbot_flow,
                    user_id=user.id,
                    original_text=text_body,
                    channel="whatsapp",
                    db=db,
                    to_phone=from_phone
                )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error reading WhatsApp Cloud API Webhook payload: {e}")
        return {"status": "error"}


@router.post("/query", response_model=WebQueryResponse)
async def web_chatbot_query(
    payload: WebQueryRequest,
    db: Session = Depends(get_db)
):
    """Direct Web UI chatbot interaction handler. Executes synchronously."""
    user = None
    if payload.user_id:
        try:
            user_uuid = UUID(str(payload.user_id))
            user = (
                db.query(UserModel)
                .filter(UserModel.id == user_uuid)
                .first()
            )
        except ValueError:
            user = None
    
    if not user:
        # Create a temporary guest web user
        user = UserModel(
            name="Web Guest",
            language_preference=payload.language,
            status="active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Force language preference if provided in payload
    if payload.language != user.language_preference:
        user.language_preference = payload.language
        db.commit()

    # Process chatbot query flow (mimics background logic but executes synchronously)
    response_text = await process_chatbot_flow(
        user_id=user.id,
        original_text=payload.message,
        channel=payload.channel,
        db=db,
        to_phone=None # Do not dispatch twilio message for web channel
    )

    # Retrieve created message to fetch ID and timestamp
    latest_msg = db.query(MessageModel).join(ConversationModel).filter(
        ConversationModel.user_id == user.id,
        MessageModel.sender == "bot"
    ).order_by(MessageModel.timestamp.desc()).first()

    msg_id = str(latest_msg.id) if latest_msg else "unknown-id"
    ts = latest_msg.timestamp if latest_msg else datetime.utcnow()

    return WebQueryResponse(
        message_id=msg_id,
        original_query=payload.message,
        detected_language=user.language_preference,
        response_text=response_text or "Sorry, I encountered an issue.",
        timestamp=ts
    )
