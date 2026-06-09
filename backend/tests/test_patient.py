import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

def test_patient_signup_login_profile(client: TestClient):
    # 1. Sign up patient
    signup_data = {
        "phone_number": "+2222222222",
        "email": "patient@example.com",
        "name": "Patient Tester",
        "language_preference": "te",
        "password": "patientpassword123"
    }
    response = client.post("/api/v1/patient/signup", json=signup_data)
    assert response.status_code == 201
    assert response.json()["name"] == "Patient Tester"
    assert response.json()["is_admin"] is False
    assert response.json()["email"] == "patient@example.com"

    # 2. Login patient (by email)
    login_data = {
        "username": "patient@example.com",
        "password": "patientpassword123"
    }
    login_response = client.post("/api/v1/patient/login", json=login_data)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Retrieve patient profile
    profile_response = client.get("/api/v1/patient/me", headers=headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["name"] == "Patient Tester"

    # 4. Update patient profile (Query parameters)
    update_response = client.put(
        "/api/v1/patient/profile", 
        params={"name": "Patient Tester Updated", "language_preference": "hi"},
        headers=headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Patient Tester Updated"
    assert update_response.json()["language_preference"] == "hi"

    # 5. Get report
    report_response = client.get("/api/v1/patient/report", headers=headers)
    assert report_response.status_code == 200
    assert report_response.headers["content-type"] == "application/pdf"
