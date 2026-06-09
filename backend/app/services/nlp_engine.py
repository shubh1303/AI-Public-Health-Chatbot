import logging
import httpx
import re
from app.core.config import settings

logger = logging.getLogger("app.services.nlp_engine")

# Detailed local responses for common public health topics
HEALTH_RESPONSES = {
    "polio_info": (
        "Polio (poliomyelitis) is a highly infectious viral disease that mainly affects children under 5 years of age. "
        "The virus is transmitted person-to-person, spread mainly through the fecal-oral route or, less frequently, "
        "by contaminated water or food. It invades the nervous system and can cause total paralysis in a matter of hours. "
        "There is no cure for polio; it can only be prevented by immunization using the polio vaccine.\n\n"
        "Common symptoms include fever, fatigue, headache, vomiting, stiffness in the neck, and pain in the limbs. "
        "In a small percentage of cases, permanent paralysis occurs.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "polio_schedule": (
        "Hello! Your child's polio vaccination is scheduled for June 12, 2026. Please bring your card to the clinic."
    ),
    "polio_education_schedule": (
        "According to public health guidelines, children should receive the polio vaccine (IPV) at the following ages:\n"
        "- 1st dose: 2 months\n"
        "- 2nd dose: 4 months\n"
        "- 3rd dose: 6 to 18 months\n"
        "- 4th dose (booster): 4 to 6 years\n\n"
        "*Disclaimer: This information is for educational purposes only. Always consult a healthcare provider for medical concerns.*"
    ),
    "vaccination_schedule": (
        "You can view your complete upcoming vaccination schedules, appointments, and due dates "
        "directly on your Patient Dashboard under the Vaccination Calendar section.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "measles_info": (
        "Measles is a highly contagious infectious disease caused by the measles virus (a morbillivirus). "
        "It spreads easily through the air by respiratory droplets produced when an infected person coughs or sneezes. "
        "Symptoms typically appear 10–14 days after exposure and include a high fever, cough, runny nose, red/watery eyes, "
        "and tiny white spots (Koplik's spots) inside the mouth, followed by a characteristic widespread skin rash.\n\n"
        "The most effective way to prevent measles is through the MMR (Measles, Mumps, and Rubella) vaccine.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "flu_info": (
        "Influenza (the flu) is a contagious respiratory illness caused by influenza viruses that infect the nose, throat, "
        "and lungs. Symptoms include a sudden onset of high fever, chills, cough (usually dry), sore throat, runny or stuffy nose, "
        "muscle or body aches, headaches, and extreme fatigue.\n\n"
        "The flu spreads easily from person to person through respiratory droplets. An annual flu vaccine is highly recommended "
        "for everyone 6 months of age and older to prevent severe complications.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "vaccine_purpose": (
        "The primary purpose of vaccination is to stimulate your body's immune system to produce antibodies and memory cells "
        "to recognize and fight off specific pathogens (viruses or bacteria) without causing the disease itself. "
        "Vaccines protect you from contracting severe illnesses, lower hospitalizations, prevent long-term health complications, "
        "and establish herd immunity to safeguard vulnerable populations who cannot be vaccinated.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "vaccine_side_effects": (
        "Common vaccine side effects are typically mild and temporary, representing normal signs that your body is building protection. "
        "These include soreness, redness, or swelling at the injection site, a low-grade fever, mild fatigue, headaches, or muscle aches. "
        "These symptoms usually resolve on their own within a few days.\n\n"
        "If you experience a severe allergic reaction (such as difficulty breathing, hives, or swelling of the face/throat) "
        "or if side effects persist past a few days, please seek medical care immediately.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "symptom_guidance": (
        "Symptom Guidance (Fever/Cough): A fever and cough are common responses of the body's immune system to respiratory infections "
        "such as a cold, influenza, or COVID-19. We advise getting plenty of rest, staying well-hydrated with water or clear fluids, "
        "and monitoring your temperature. Over-the-counter fever reducers (like paracetamol/acetaminophen) can help manage discomfort, "
        "but always adhere to dosage guidelines.\n\n"
        "Please seek immediate medical attention if you experience warning signs like difficulty breathing, persistent chest pain, "
        "confusion, high fever unresponsive to medication, or bluish lips.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    ),
    "emergency_symptom": (
        "WARNING: You are describing symptoms that could indicate a serious or life-threatening medical emergency (such as a cardiac event or severe respiratory distress).\n\n"
        "Please seek immediate emergency medical services (call 911 or your local emergency number) or go to the nearest emergency room immediately.\n\n"
        "*Disclaimer: This is an automated warning for educational purposes. Do not delay seeking professional emergency care.*"
    ),
    "booster_dose": (
        "You can get the COVID-19 booster dose at your nearest primary health center. "
        "You can find locations and schedule appointments at: https://vaccine.gov/centers"
    ),
    "greetings": (
        "Hello! I am your AI Public Health Assistant. How can I help you today with information about vaccinations, "
        "diseases (like polio, measles, or flu), or symptoms? (Please note I provide educational information, "
        "not professional medical advice)."
    ),
    "thanks": (
        "You are welcome! Stay healthy."
    ),
    "default": (
        "I am your AI Public Health Assistant, trained to provide educational information about vaccinations, "
        "infectious diseases (like polio, measles, or flu), and general symptom guidance.\n\n"
        "If you have a specific question about these topics, please ask! For official public health instructions "
        "or local clinic centers, you can visit https://vaccine.gov.\n\n"
        "*Disclaimer: This information is for educational purposes only and does not substitute for professional medical advice. "
        "Always consult a healthcare provider for medical concerns.*"
    )
}

class NLPEngineService:
    def __init__(self):
        self.rasa_url = settings.RASA_URL
        self.is_active = (
            self.rasa_url 
            and not self.rasa_url.startswith("http://localhost")
        )

    async def parse_and_respond(self, text: str, original_text: str | None = None) -> dict:
        """Parses the message using Rasa or falls back to rule-based intent parsing.
        Returns a dictionary containing 'intent' and 'response_text'.
        """
        if self.is_active:
            try:
                # Query Rasa webhook
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{self.rasa_url}/webhooks/rest/webhook",
                        json={"sender": "user", "message": text},
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        rasa_responses = response.json()
                        if rasa_responses:
                            # Aggregate response text
                            combined_text = " ".join([r.get("text", "") for r in rasa_responses])
                            return {
                                "intent": "rasa_extracted_intent",
                                "response_text": combined_text
                            }
            except Exception as e:
                logger.error(f"Failed to connect to Rasa NLP service: {e}")

        # Local keyword-matching fallback
        texts_to_check = [text]
        if original_text and original_text != text:
            texts_to_check.append(original_text)

        lowercase_texts = [t.lower() for t in texts_to_check]

        # 1. Greetings & thanks
        is_greet = False
        for t in lowercase_texts:
            if any(re.search(rf"\b{kw}\b", t) for kw in ["hello", "hi", "hey", "greetings"]):
                is_greet = True
                break
            if any(kw in t for kw in ["नमस्ते", "हैलो", "सुप्रभात", "హలో", "నమస్తే"]):
                is_greet = True
                break

        if is_greet:
            return {"intent": "greet", "response_text": HEALTH_RESPONSES["greetings"]}

        is_thanks = False
        for t in lowercase_texts:
            if any(re.search(rf"\b{kw}\b", t) for kw in ["thank you", "thanks"]):
                is_thanks = True
                break
            if any(kw in t for kw in ["धन्यवाद", "शुक्रिया", "ధన్యవాదాలు"]):
                is_thanks = True
                break

        if is_thanks:
            return {"intent": "thank_you", "response_text": HEALTH_RESPONSES["thanks"]}

        # 2. Emergency Symptoms (High priority check, must run before general symptoms and other matches)
        emergency_keywords_en = ["chest pain", "difficulty breathing", "shortness of breath", "heart attack", "stroke", "unconscious", "cannot breathe", "seizure"]
        emergency_keywords_native = ["सीने में दर्द", "छाती में दर्द", "सांस लेने में तकलीफ", "सांस नहीं आ रही", "बेहोश", "दौरा", "ఛాతీ నొప్పి", "శ్వాస తీసుకోవడంలో ఇబ్బంది", "స్పృహ తప్పడం"]
        
        is_emergency = False
        for t in lowercase_texts:
            if any(phrase in t for phrase in emergency_keywords_en + emergency_keywords_native):
                is_emergency = True
                break
        
        if is_emergency:
            return {"intent": "emergency_symptom", "response_text": HEALTH_RESPONSES["emergency_symptom"]}

        # 3. Polio
        polio_keywords = ["polio", "पोलियो", "पोलीयो", "పోలియో"]
        has_polio = False
        for t in lowercase_texts:
            if any(kw in t for kw in polio_keywords):
                has_polio = True
                break

        if has_polio:
            sched_kws = ["schedule", "when", "appoint", "date", "child", "reminder", "upcoming", 
                         "शेड्यूल", "कब", "तारीख", "बच्चे", "अनुसूची", "टीकाकरण", "अपॉइंटमेंट",
                         "షెడ్యూల్", "ఎప్పుడు", "తేదీ", "పిల్లల"]
            has_sched = False
            for t in lowercase_texts:
                if any(kw in t for kw in sched_kws):
                    has_sched = True
                    break
            
            if has_sched:
                personal_kws = ["my", "child's polio", "me", "i have", "scheduled for me", "appointment",
                                "मेरा", "मेरे", "मुझे", "अपॉइंटमेंट", "నా", "నాకు", "అపాయింట్‌మెంట్"]
                has_personal = False
                for t in lowercase_texts:
                    if any(kw in t for kw in personal_kws):
                        has_personal = True
                        break
                
                if has_personal:
                    return {"intent": "query_polio_vaccine", "response_text": HEALTH_RESPONSES["polio_schedule"]}
                else:
                    return {"intent": "query_polio_education_schedule", "response_text": HEALTH_RESPONSES["polio_education_schedule"]}
            else:
                return {"intent": "query_polio_disease", "response_text": HEALTH_RESPONSES["polio_info"]}

        # 4. Schedule / Appointments (Generic)
        generic_sched_kws = ["schedule", "appointment", "due date", "reminder", "upcoming", "next vaccination", "when is my", "scheduled for me",
                             "शेड्यूल", "अपॉइंटमेंट", "तिथि", "स्मरणपत्र", "షెడ్యూల్", "అపాయింట్‌మెంట్", "తేదీ"]
        has_generic_sched = False
        for t in lowercase_texts:
            if any(kw in t for kw in generic_sched_kws):
                has_generic_sched = True
                break
        
        if has_generic_sched:
            return {"intent": "query_vaccination_schedule", "response_text": HEALTH_RESPONSES["vaccination_schedule"]}

        # 5. Measles
        measles_keywords = ["measles", "खसरा", "తట్టు"]
        has_measles = False
        for t in lowercase_texts:
            if any(kw in t for kw in measles_keywords):
                has_measles = True
                break

        if has_measles:
            return {"intent": "query_measles", "response_text": HEALTH_RESPONSES["measles_info"]}

        # 6. Flu / Influenza
        flu_keywords = ["flu", "influenza", "फ्लू", "इन्फ्लूएंजा", "ఫ్లూ"]
        has_flu = False
        for t in lowercase_texts:
            if any(kw in t for kw in flu_keywords):
                has_flu = True
                break

        if has_flu:
            return {"intent": "query_flu", "response_text": HEALTH_RESPONSES["flu_info"]}

        # 7. Vaccine Purpose
        purpose_kws = ["purpose", "why", "benefit", "reason", "importance", "what is the use",
                       "महत्व", "उद्देश्य", "लाभ", "क्यों", "कारण", "उपयोग", "ఉద్దేశ్యం", "ఎందుకు", "ప్రయోజనం", "కారణం"]
        vaccine_kws = ["vaccin", "immuniz", "shot", "टीका", "टीकाकरण", "टीके", "टीकों", "टीकाकरणों", "టీకా", "టీకాలు"]
        
        has_purpose = False
        has_vaccine = False
        for t in lowercase_texts:
            if any(kw in t for kw in purpose_kws):
                has_purpose = True
            if any(kw in t for kw in vaccine_kws):
                has_vaccine = True

        if has_purpose and has_vaccine:
            return {"intent": "query_vaccine_purpose", "response_text": HEALTH_RESPONSES["vaccine_purpose"]}

        # 8. Vaccine Side Effects
        side_effects_kws = ["side effect", "reaction", "adverse", "pain", "sore",
                            "दुष्प्रभाव", "असर", "प्रतिक्रिया", "दुष्प्रभावों", "साइड इफेक्ट", "దుష్ప్రభావాలు", "నొప్పి"]
        has_side_effects = False
        has_vaccine_se = False
        for t in lowercase_texts:
            if any(kw in t for kw in side_effects_kws):
                has_side_effects = True
            if any(kw in t for kw in vaccine_kws):
                has_vaccine_se = True

        if has_side_effects and has_vaccine_se:
            return {"intent": "query_vaccine_side_effects", "response_text": HEALTH_RESPONSES["vaccine_side_effects"]}

        # 9. Symptoms Guidance (Fever, cough, headache, sore throat, etc.)
        symptom_kws = ["fever", "cough", "headache", "sore throat", "symptom", "ill", "sick",
                       "बुखार", "खांसी", "गला खराब", "लक्षण", "बीमार", "सिरदर्द", "జ్వరం", "దగ్గు", "తలనొప్పి", "లక్షణాలు"]
        has_symptom = False
        for t in lowercase_texts:
            if any(kw in t for kw in symptom_kws):
                has_symptom = True
                break

        if has_symptom:
            return {"intent": "symptom_guidance", "response_text": HEALTH_RESPONSES["symptom_guidance"]}

        # 10. Booster / COVID
        booster_kws = ["booster", "covid", "center", "where", "बूस्टर", "कोविड", "केंद्र", "कहां", "బూస్టర్", "కోవిడ్"]
        has_booster = False
        for t in lowercase_texts:
            if any(kw in t for kw in booster_kws):
                has_booster = True
                break

        if has_booster:
            return {"intent": "query_booster_dose", "response_text": HEALTH_RESPONSES["booster_dose"]}

        # 11. Fallback
        logger.info("[Mock NLP] No intent matched. Returning default response.")
        return {
            "intent": "out_of_scope",
            "response_text": HEALTH_RESPONSES["default"]
        }

nlp_engine_service = NLPEngineService()
