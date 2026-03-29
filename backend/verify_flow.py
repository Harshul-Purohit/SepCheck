import requests
import time

BASE_URL = "http://localhost:8000"

def verify_full_flow():
    print("--- Verifying SepCheck Full Flow ---")
    
    # 1. Register
    email = f"test_user_{int(time.time())}@example.com"
    reg_data = {
        "email": email,
        "password": "password123",
        "role": "patient"
    }
    print(f"1. Registering: {email}")
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    if reg_res.status_code != 200:
        print(f"FAILED: {reg_res.text}")
        return
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("SUCCESS")

    # 2. Create Profile
    profile_data = {
        "full_name": "Test Patient",
        "age": 30,
        "gender": "Male",
        "weight": 75.0,
        "height": 175.0,
        "blood_group": "O+",
        "blood_pressure": "120/80",
        "heart_rate": 72,
        "temperature": 98.6,
        "existing_diseases": "None",
        "allergies": "None",
        "contact_info": "1234567890"
    }
    print("2. Creating Profile")
    prof_res = requests.post(f"{BASE_URL}/patient/profile", json=profile_data, headers=headers)
    if prof_res.status_code != 200:
        print(f"FAILED: {prof_res.text}")
        return
    print("SUCCESS")

    # 3. Submit Questionnaire
    questionnaire = {
        "fever": True,
        "heart_rate_high": True,
        "rapid_breathing": False,
        "confusion": False,
        "infection_history": False,
        "low_blood_pressure_symptoms": False,
        "recent_surgery_injury": False,
        "additional_notes": "Feeling slightly feverish"
    }
    print("3. Submitting Questionnaire")
    quest_res = requests.post(f"{BASE_URL}/patient/assessment", json=questionnaire, headers=headers)
    if quest_res.status_code != 200:
        print(f"FAILED: {quest_res.text}")
        return
    report = quest_res.json()
    print(f"SUCCESS. Risk level: {report['risk_level']}")
    print(f"AI Analysis: {report['explanation'][:100]}...")

    print("\n--- Flow Verification Complete ---")

if __name__ == "__main__":
    verify_full_flow()
