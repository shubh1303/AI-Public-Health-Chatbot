import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_admin_signup_and_login(client: TestClient):
    # 1. Sign up admin user
    signup_data = {
        "phone_number": "+1111111111",
        "name": "Admin Tester",
        "language_preference": "en",
        "password": "securepassword123",
        "is_admin": True
    }
    response = client.post("/api/v1/admin/signup", json=signup_data)
    assert response.status_code == 201
    assert response.json()["name"] == "Admin Tester"
    assert response.json()["is_admin"] is True

    # 2. Login to get JWT Token
    login_data = {
        "username": "+1111111111",
        "password": "securepassword123"
    }
    login_response = client.post("/api/v1/admin/login", data=login_data)
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
    assert login_response.json()["token_type"] == "bearer"


def test_chatbot_query_web(client: TestClient):
    query_payload = {
        "message": "Where can I get the COVID booster dose?",
        "language": "en",
        "channel": "web"
    }
    response = client.post("/api/v1/chatbot/query", json=query_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["original_query"] == "Where can I get the COVID booster dose?"
    assert "booster" in data["response_text"].lower() or "covid" in data["response_text"].lower()


def test_twilio_webhook(client: TestClient, db: Session):
    form_data = {
        "From": "+9999999999",
        "Body": "Hello"
    }
    # Send request as x-www-form-urlencoded
    response = client.post("/api/v1/chatbot/webhook", data=form_data)
    assert response.status_code == 200
    
    # Check database to see if a user was created and message registered
    user = db.query(User).filter(User.phone_number == "+9999999999").first()
    assert user is not None
    assert user.name == "User 9999"


def test_vaccination_schedule_flow(client: TestClient, db: Session):
    # 1. Sign up admin user
    signup_data = {
        "phone_number": "+11234567890",
        "name": "Migration Tester",
        "language_preference": "en",
        "password": "securepassword123",
        "is_admin": True
    }
    response = client.post("/api/v1/admin/signup", json=signup_data)
    assert response.status_code == 201
    user_id = response.json()["id"]

    # 2. Login to get JWT Token
    login_data = {
        "username": "+11234567890",
        "password": "securepassword123"
    }
    login_response = client.post("/api/v1/admin/login", data=login_data)
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Schedule vaccination
    schedule_data = {
        "user_id": user_id,
        "vaccine_name": "MMR",
        "dose_number": 1,
        "scheduled_date": "2026-06-10"
    }
    sched_response = client.post("/api/v1/vaccinations/schedule", json=schedule_data, headers=headers)
    assert sched_response.status_code == 201
    record = sched_response.json()
    assert "sms_delivery_status" in record
    assert "sms_sent_at" in record
    assert record["sms_delivery_status"] is None

    # 4. Get vaccinations list
    list_response = client.get("/api/v1/vaccinations/", headers=headers)
    assert list_response.status_code == 200
    records = list_response.json()
    assert len(records) > 0
    assert "sms_delivery_status" in records[0]
