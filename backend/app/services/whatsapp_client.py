import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("app.services.whatsapp_client")

class WhatsAppClient:
    def __init__(self):
        self.api_token = settings.WHATSAPP_API_TOKEN
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.is_active = (
            self.api_token 
            and not self.api_token.startswith("mock")
            and self.phone_number_id
            and not self.phone_number_id.startswith("mock")
        )
        if not self.is_active:
            logger.warning("WhatsApp Cloud API client initialized in MOCK mode due to placeholder credentials.")

    async def send_message(self, to_phone: str, text: str) -> bool:
        """Sends a message using the official Meta WhatsApp Cloud API.
        Returns True if successful, False otherwise.
        """
        # Clean phone number (strip "whatsapp:" prefix if sent by mistake)
        clean_phone = to_phone.replace("whatsapp:", "").replace(" ", "").replace("-", "")
        
        if not self.is_active:
            logger.info(f"[MOCK Meta WhatsApp API] Sending to {clean_phone}: {text}")
            return True

        url = f"https://graph.facebook.com/v19.0/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {"body": text},
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                if response.status_code in [200, 201]:
                    logger.info(f"WhatsApp Cloud API message successfully sent to {clean_phone}.")
                    return True
                else:
                    logger.error(f"WhatsApp Cloud API error {response.status_code}: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to post message to WhatsApp Cloud API: {e}")
            return False

whatsapp_client = WhatsAppClient()
