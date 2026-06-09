import sys
sys.stdout.reconfigure(encoding='utf-8')
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_db, SessionLocal
from app.models.user import User
from uuid import uuid4

client = TestClient(app)

# Create a clean test user or get an existing one
db = SessionLocal()
try:
    test_user = db.query(User).filter(User.phone_number == "+9999999999").first()
    if not test_user:
        test_user = User(
            id=uuid4(),
            phone_number="+9999999999",
            name="Test User",
            language_preference="en",
            status="active"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
    user_id = str(test_user.id)

    # Clear FAQ cache to prevent stale mock translation hits during validation
    from app.models.faq import FAQCache
    db.query(FAQCache).delete()
    db.commit()
finally:
    db.close()

test_cases = [
    # 1. Vaccination Schedule Query
    {
        "payload": {
            "message": "When should a child receive the polio vaccine?",
            "language": "en",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_polio_education_schedule",
        "expected_substring": "IPV"
    },
    # 2. Emergency Symptom Detection
    {
        "payload": {
            "message": "I have chest pain and difficulty breathing",
            "language": "en",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "emergency_symptom",
        "expected_substring": "WARNING"
    },
    # 3. English Disease Query
    {
        "payload": {
            "message": "What is polio?",
            "language": "en",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_polio_disease",
        "expected_substring": "infectious viral disease"
    },
    # 4. English Symptom Query
    {
        "payload": {
            "message": "I have fever",
            "language": "en",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "symptom_guidance",
        "expected_substring": "Fever/Cough"
    },
    # 5. English Measles Query
    {
        "payload": {
            "message": "What causes measles?",
            "language": "en",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_measles",
        "expected_substring": "MMR"
    },
    # 6. Hindi Polio Query
    {
        "payload": {
            "message": "पोलियो क्या है?",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_polio_disease",
        "expected_substring": "पोलियो एक वायरल बीमारी है"
    },
    # 7. Hindi Polio Short Query
    {
        "payload": {
            "message": "पोलियो?",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_polio_disease",
        "expected_substring": "पोलियो एक वायरल बीमारी है"
    },
    # 8. Hindi Fever Query
    {
        "payload": {
            "message": "मुझे बुखार है",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "symptom_guidance",
        "expected_substring": "बुखार संक्रमण का एक सामान्य लक्षण"
    },
    # 9. Hindi Emergency Query
    {
        "payload": {
            "message": "मुझे सीने में दर्द है",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "emergency_symptom",
        "expected_substring": "चेतावनी: आप ऐसे लक्षणों का वर्णन कर रहे हैं"
    },
    # 10. Hindi Measles Query
    {
        "payload": {
            "message": "खसरा क्या है?",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_measles",
        "expected_substring": "खसरा एक अत्यधिक संक्रामक"
    },
    # 11. Hindi Flu Query
    {
        "payload": {
            "message": "फ्लू क्या है?",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_flu",
        "expected_substring": "इन्फ्लूएंजा (फ्लू) एक संक्रामक"
    },
    # 12. Hindi Side Effects Query
    {
        "payload": {
            "message": "टीके के दुष्प्रभाव क्या हैं?",
            "language": "hi",
            "channel": "web",
            "user_id": user_id
        },
        "expected_intent": "query_vaccine_side_effects",
        "expected_substring": "टीके के सामान्य दुष्प्रभाव"
    }
]

for idx, tc in enumerate(test_cases, 1):
    print(f"Test Case {idx}: Query = '{tc['payload']['message']}'")
    response = client.post("/api/v1/chatbot/query", json=tc["payload"])
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    print(f"Detected Language: {data['detected_language']}")
    print(f"Response: {data['response_text']}")
    # Assert that the expected substring is present in the response
    assert tc["expected_substring"] in data["response_text"], f"Expected substring '{tc['expected_substring']}' not found in response"
    print("-" * 60)

