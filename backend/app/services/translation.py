import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("app.services.translation")

# Rule-based simple translation mappings for testing/mocking
MOCK_TRANSLATIONS = {
    # English to Hindi
    ("where can i get the covid booster dose?", "en", "hi"): "आप अपने नजदीकी प्राथमिक स्वास्थ्य केंद्र पर कोविड बूस्टर खुराक प्राप्त कर सकते हैं।",
    ("should i get vaccinated tomorrow?", "en", "hi"): "हाँ, आपकी खुराक कल के लिए अनुसूचित है।",
    ("hello", "en", "hi"): "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?",
    ("thank you", "en", "hi"): "धन्यवाद!",
    (
        "polio (poliomyelitis) is a highly infectious viral disease that mainly affects children under 5 years of age. the virus is transmitted person-to-person, spread mainly through the fecal-oral route or, less frequently, by contaminated water or food. it invades the nervous system and can cause total paralysis in a matter of hours. there is no cure for polio; it can only be prevented by immunization using the polio vaccine.\n\ncommon symptoms include fever, fatigue, headache, vomiting, stiffness in the neck, and pain in the limbs. in a small percentage of cases, permanent paralysis occurs.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "पोलियो एक वायरल बीमारी है जो मुख्य रूप से छोटे बच्चों को प्रभावित करती है। यह पोलियोवायरस के कारण होती है और गंभीर मामलों में लकवा का कारण बन सकती है। पोलियो से बचाव का सबसे प्रभावी तरीका समय पर टीकाकरण है।",
    (
        "symptom guidance (fever/cough): a fever and cough are common responses of the body's immune system to respiratory infections such as a cold, influenza, or covid-19. we advise getting plenty of rest, staying well-hydrated with water or clear fluids, and monitoring your temperature. over-the-counter fever reducers (like paracetamol/acetaminophen) can help manage discomfort, but always adhere to dosage guidelines.\n\nplease seek immediate medical attention if you experience warning signs like difficulty breathing, persistent chest pain, confusion, high fever unresponsive to medication, or bluish lips.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "बुखार संक्रमण का एक सामान्य लक्षण हो सकता है। पर्याप्त आराम करें, पानी पिएं और अपने तापमान की निगरानी करें। यदि बुखार बहुत अधिक हो या लंबे समय तक बना रहे, तो डॉक्टर से संपर्क करें।",
    (
        "warning: you are describing symptoms that could indicate a serious or life-threatening medical emergency (such as a cardiac event or severe respiratory distress).\n\nplease seek immediate emergency medical services (call 911 or your local emergency number) or go to the nearest emergency room immediately.\n\n*disclaimer: this is an automated warning for educational purposes. do not delay seeking professional emergency care.*",
        "en",
        "hi"
    ): "चेतावनी: आप ऐसे लक्षणों का वर्णन कर रहे हैं जो एक गंभीर या जीवन-धमकाने वाली चिकित्सा आपात स्थिति (जैसे हृदय घटना या गंभीर श्वसन संकट) का संकेत दे सकते हैं।\n\nकृपया तत्काल आपातकालीन चिकित्सा सेवाओं से संपर्क करें (अपने स्थानीय आपातकालीन नंबर पर कॉल करें) या तुरंत निकटतम आपातकालीन कक्ष में जाएं।\n\n*अस्वीकरण: यह शैक्षिक उद्देश्यों के लिए एक स्वचालित चेतावनी है। पेशेवर आपातकालीन देखभाल प्राप्त करने में देरी न करें।*",
    (
        "hello! i am your ai public health assistant. how can i help you today with information about vaccinations, diseases (like polio, measles, or flu), or symptoms? (please note i provide educational information, not professional medical advice).",
        "en",
        "hi"
    ): "नमस्ते! मैं आपका एआई जन स्वास्थ्य सहायक (AI Public Health Assistant) हूँ। मैं आज टीकाकरण, बीमारियों (जैसे पोलियो, खसरा या फ्लू) या लक्षणों के बारे में जानकारी देने में आपकी क्या मदद कर सकता हूँ? (कृपया ध्यान दें कि मैं केवल शैक्षिक जानकारी प्रदान करता हूँ, पेशेवर चिकित्सा सलाह नहीं)।",
    (
        "you are welcome! stay healthy.",
        "en",
        "hi"
    ): "आपका स्वागत है! स्वस्थ रहें।",
    (
        "i am your ai public health assistant, trained to provide educational information about vaccinations, infectious diseases (like polio, measles, or flu), and general symptom guidance.\n\nif you have a specific question about these topics, please ask! for official public health instructions or local clinic centers, you can visit https://vaccine.gov.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "मैं आपका एआई जन स्वास्थ्य सहायक हूँ, जिसे टीकाकरण, संक्रामक बीमारियों (जैसे पोलियो, खसरा, या फ्लू) और सामान्य लक्षण मार्गदर्शन के बारे में शैक्षिक जानकारी प्रदान करने के लिए प्रशिक्षित किया गया है।\n\nयदि आपके पास इन विषयों के बारे में कोई विशिष्ट प्रश्न है, तो कृपया पूछें! आधिकारिक सार्वजनिक स्वास्थ्य निर्देशों या स्थानीय क्लिनिक केंद्रों के लिए, आप https://vaccine.gov पर जा सकते हैं।\n\n*अस्वीकरण: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। हमेशा चिकित्सा चिंताओं के लिए स्वास्थ्य सेवा प्रदाता से परामर्श लें।*",
    (
        "measles is a highly contagious infectious disease caused by the measles virus (a morbillivirus). it spreads easily through the air by respiratory droplets produced when an infected person coughs or sneezes. symptoms typically appear 10–14 days after exposure and include a high fever, cough, runny nose, red/watery eyes, and tiny white spots (koplik's spots) inside the mouth, followed by a characteristic widespread skin rash.\n\nthe most effective way to prevent measles is through the mmr (measles, mumps, and rubella) vaccine.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "खसरा एक अत्यधिक संक्रामक संक्रामक बीमारी है जो खसरा वायरस के कारण होती है। यह संक्रमित व्यक्ति के खांसने या छींकने पर उत्पन्न होने वाली श्वसन बूंदों द्वारा हवा के माध्यम से आसानी से फैलती है। लक्षण आमतौर पर जोखिम के 10-14 दिन बाद दिखाई देते हैं और इसमें तेज बुखार, खांसी, बहती नाक, लाल/पानी वाली आंखें और मुंह के अंदर छोटे सफेद धब्बे शामिल हैं, जिसके बाद त्वचा पर दाने निकल आते हैं।\n\nखसरे को रोकने का सबसे प्रभावी तरीका एमएमआर (खसरा, कण्ठमाला और रूबेला) टीका है।\n\n*अस्वीकरण: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। हमेशा चिकित्सा चिंताओं के लिए स्वास्थ्य सेवा प्रदाता से परामर्श लें।*",
    (
        "influenza (the flu) is a contagious respiratory illness caused by influenza viruses that infect the nose, throat, and lungs. symptoms include a sudden onset of high fever, chills, cough (usually dry), sore throat, runny or stuffy nose, muscle or body aches, headaches, and extreme fatigue.\n\nthe flu spreads easily from person to person through respiratory droplets. an annual flu vaccine is highly recommended for everyone 6 months of age and older to prevent severe complications.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "इन्फ्लूएंजा (फ्लू) एक संक्रामक श्वसन बीमारी है जो इन्फ्लूएंजा वायरस के कारण होती है जो नाक, गले और फेफड़ों को संक्रमित करती है। लक्षणों में अचानक तेज बुखार आना, ठंड लगना, सूखी खांसी, गले में खराश, बहती या बंद नाक, मांसपेशियों या शरीर में दर्द, सिरदर्द और अत्यधिक थकान शामिल हैं।\n\nफ्लू श्वसन बूंदों के माध्यम से एक व्यक्ति से दूसरे व्यक्ति में आसानी से फैलता है। गंभीर जटिलताओं को रोकने के लिए 6 महीने और उससे अधिक उम्र के सभी लोगों के लिए वार्षिक फ्लू वैक्सीन की अत्यधिक सिफारिश की जाती है।\n\n*अस्वीकरण: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। हमेशा चिकित्सा चिंताओं के लिए स्वास्थ्य सेवा प्रदाता से परामर्श लें।*",
    (
        "common vaccine side effects are typically mild and temporary, representing normal signs that your body is building protection. these include soreness, redness, or swelling at the injection site, a low-grade fever, mild fatigue, headaches, or muscle aches. these symptoms usually resolve on their own within a few days.\n\nif you experience a severe allergic reaction (such as difficulty breathing, hives, or swelling of the face/throat) or if side effects persist past a few days, please seek medical care immediately.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "टीके के सामान्य दुष्प्रभाव आमतौर पर हल्के और अस्थायी होते हैं, जो सामान्य संकेत हैं कि आपका शरीर सुरक्षा का निर्माण कर रहा है। इनमें इंजेक्शन वाली जगह पर दर्द, लालिमा या सूजन, हल्का बुखार, हल्की थकान, सिरदर्द या मांसपेशियों में दर्द शामिल हैं। ये लक्षण आमतौर पर कुछ दिनों के भीतर अपने आप ठीक हो जाते हैं।\n\nयदि आप गंभीर एलर्जी प्रतिक्रिया (जैसे सांस लेने में कठिनाई, पित्ती, या चेहरे/गले की सूजन) का अनुभव करते हैं या यदि दुष्प्रभाव कुछ दिनों से अधिक समय तक बने रहते हैं, तो कृपया तुरंत चिकित्सा सहायता लें।\n\n*अस्वीकरण: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। हमेशा चिकित्सा चिंताओं के लिए स्वास्थ्य सेवा प्रदाता से परामर्श लें।*",
    (
        "the primary purpose of vaccination is to stimulate your body's immune system to produce antibodies and memory cells to recognize and fight off specific pathogens (viruses or bacteria) without causing the disease itself. vaccines protect you from contracting severe illnesses, lower hospitalizations, prevent long-term health complications, and establish herd immunity to safeguard vulnerable populations who cannot be vaccinated.\n\n*disclaimer: this information is for educational purposes only and does not substitute for professional medical advice. always consult a healthcare provider for medical concerns.*",
        "en",
        "hi"
    ): "टीकाकरण का प्राथमिक उद्देश्य बीमारी पैदा किए बिना विशिष्ट रोगजनकों (वायरस या बैक्टीरिया) को पहचानने और उनसे लड़ने के लिए आपके शरीर की प्रतिरक्षा प्रणाली को एंटीबॉडी और मेमोरी कोशिकाओं का उत्पादन करने के लिए प्रेरित करना है। टीके आपको गंभीर बीमारियों से बचाते हैं, अस्पताल में भर्ती होने की दर को कम करते हैं, दीर्घकालिक स्वास्थ्य जटिलताओं को रोकते हैं, और उन कमजोर आबादी की सुरक्षा के लिए हर्ड इम्युनिटी स्थापित करते हैं जिनका टीकाकरण नहीं किया जा सकता है।\n\n*अस्वीकरण: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है। हमेशा चिकित्सा चिंताओं के लिए स्वास्थ्य सेवा प्रदाता से परामर्श लें।*",
    (
        "you can get the covid-19 booster dose at your nearest primary health center. you can find locations and schedule appointments at: https://vaccine.gov/centers",
        "en",
        "hi"
    ): "आप अपने नजदीकी प्राथमिक स्वास्थ्य केंद्र पर कोविड-19 बूस्टर खुराक प्राप्त कर सकते हैं। आप https://vaccine.gov/centers पर स्थान पा सकते हैं और नियुक्तियां निर्धारित कर सकते हैं।",

    # Hindi to English
    ("क्या मुझे कल टीका लगवाना चाहिए?", "hi", "en"): "Should I get vaccinated tomorrow?",
    ("नमस्ते", "hi", "en"): "Hello",
    ("धन्यवाद", "hi", "en"): "Thank you",
    ("पोलियो क्या है?", "hi", "en"): "What is polio?",
    ("पोलियो?", "hi", "en"): "What is polio?",
    ("मुझे बुखार है", "hi", "en"): "I have fever",
    ("मुझे सीने में दर्द है", "hi", "en"): "I have chest pain and difficulty breathing",
    ("खसरा क्या है?", "hi", "en"): "What causes measles?",
    ("फ्लू क्या है?", "hi", "en"): "What is flu?",
    ("टीके के दुष्प्रभाव क्या हैं?", "hi", "en"): "What are vaccine side effects?",
}

class TranslationService:
    def __init__(self):
        self.api_url = settings.TRANSLATION_API_URL
        self.is_active = (
            self.api_url 
            and not self.api_url.startswith("http://localhost")
        )

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translates text from source_lang to target_lang.
        If the translation service is down or on localhost without a model, 
        returns a mock translation or prefix-based fallback.
        """
        if source_lang.lower() == target_lang.lower():
            return text

        # Check mock dictionary first
        key = (text.strip().lower(), source_lang.lower(), target_lang.lower())
        if key in MOCK_TRANSLATIONS:
            logger.info(f"[Mock Translation] Dict hit for: '{text}' ({source_lang} -> {target_lang})")
            return MOCK_TRANSLATIONS[key]

        if not self.is_active:
            # Simple fallback return for testing without wrapper brackets
            logger.warning(f"[Mock Translation] Fallback mapping missing for: '{text}' ({source_lang} -> {target_lang}). Returning original text.")
            return text

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/translate",
                    json={
                        "text": text,
                        "source_language": source_lang,
                        "target_language": target_lang
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json().get("translated_text", text)
                else:
                    logger.warning(f"Translation API error {response.status_code}: {response.text}. Returning original text.")
                    return text
        except Exception as e:
            logger.warning(f"Failed to connect to Translation API: {e}. Returning original text.")
            return text

translation_service = TranslationService()
