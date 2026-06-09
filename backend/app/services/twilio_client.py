import logging
from twilio.rest import Client
from app.core.config import settings
from app.core.metrics import metrics_tracker

logger = logging.getLogger("app.services.twilio_client")

class TwilioClient:
    def __init__(self):
        # Allow testing/mocking if credentials are placeholder values
        self.is_active = (
            settings.TWILIO_ACCOUNT_SID is not None
            and settings.TWILIO_ACCOUNT_SID != ""
            and not settings.TWILIO_ACCOUNT_SID.startswith("ACmock")
            and settings.TWILIO_AUTH_TOKEN is not None
            and settings.TWILIO_AUTH_TOKEN != ""
            and not settings.TWILIO_AUTH_TOKEN.startswith("mock")
            and settings.TWILIO_PHONE_NUMBER is not None
            and settings.TWILIO_PHONE_NUMBER != ""
        )
        if self.is_active:
            try:
                self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
                self.is_active = False
        else:
            logger.warning("Twilio client initialized in MOCK mode due to placeholder or missing credentials.")

    def send_sms(self, to_phone: str, body: str) -> bool:
        """Sends an SMS message to a phone number.
        Returns True if successful, False otherwise.
        """
        metrics_tracker.sms_attempts += 1
        logger.info(f"SMS Delivery Attempt - To: {to_phone}, Body: {body[:30]}...")
        if not self.is_active:
            logger.info(f"[MOCK SMS] Sending to {to_phone}: {body}")
            metrics_tracker.sms_successes += 1
            return True
        try:
            message = self.client.messages.create(
                body=body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            logger.info(f"SMS successfully sent. Sid: {message.sid}")
            metrics_tracker.sms_successes += 1
            return True
        except Exception as e:
            logger.error(f"Error sending Twilio SMS to {to_phone}: {e}")
            metrics_tracker.sms_failures += 1
            return False

    def send_whatsapp(self, to_phone: str, body: str) -> bool:
        """Sends a WhatsApp message to a phone number.
        Returns True if successful, False otherwise.
        """
        metrics_tracker.sms_attempts += 1
        # Ensure 'whatsapp:' prefix for Twilio Sandbox or WhatsApp numbers
        formatted_to = to_phone if to_phone.startswith("whatsapp:") else f"whatsapp:{to_phone}"
        formatted_from = settings.TWILIO_PHONE_NUMBER if settings.TWILIO_PHONE_NUMBER.startswith("whatsapp:") else f"whatsapp:{settings.TWILIO_PHONE_NUMBER}"
        
        logger.info(f"WhatsApp Delivery Attempt - To: {formatted_to}, Body: {body[:30]}...")
        if not self.is_active:
            logger.info(f"[MOCK WhatsApp via Twilio] Sending to {formatted_to}: {body}")
            metrics_tracker.sms_successes += 1
            return True
        try:
            message = self.client.messages.create(
                body=body,
                from_=formatted_from,
                to=formatted_to
            )
            logger.info(f"WhatsApp message successfully sent. Sid: {message.sid}")
            metrics_tracker.sms_successes += 1
            return True
        except Exception as e:
            logger.error(f"Error sending Twilio WhatsApp to {formatted_to}: {e}")
            metrics_tracker.sms_failures += 1
            return False

twilio_client = TwilioClient()
