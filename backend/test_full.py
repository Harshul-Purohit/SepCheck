import json
import sys

# Use urllib instead of requests to avoid encoding issues
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode

BASE = "http://localhost:8000"
results = []

def post_json(path, data):
    req = Request(f"{BASE}{path}", data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    try:
        resp = urlopen(req)
        return resp.status, json.loads(resp.read())
    except HTTPError as e:
        return e.code, json.loads(e.read())

def post_form(path, data):
    req = Request(f"{BASE}{path}", data=urlencode(data).encode(), headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        resp = urlopen(req)
        return resp.status, json.loads(resp.read())
    except HTTPError as e:
        return e.code, json.loads(e.read())

def post_json_auth(path, data, token):
    req = Request(f"{BASE}{path}", data=json.dumps(data).encode(), headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    try:
        resp = urlopen(req)
        return resp.status, json.loads(resp.read())
    except HTTPError as e:
        return e.code, json.loads(e.read())

# 1. Patient Signup
code, body = post_json("/auth/register", {"email": "p@test.com", "password": "Harshul@135", "role": "patient"})
results.append(f"1.PatientSignup: {code}")
pt = body.get("access_token") if code == 200 else None

# 2. Doctor Signup
code, body = post_json("/auth/register", {"email": "d@test.com", "password": "Doctor@135", "role": "doctor"})
results.append(f"2.DoctorSignup: {code}")
dt = body.get("access_token") if code == 200 else None

# 3. Patient Login
code, body = post_form("/auth/login", {"username": "p@test.com", "password": "Harshul@135"})
results.append(f"3.PatientLogin: {code}")

# 4. Doctor Login
code, body = post_form("/auth/login", {"username": "d@test.com", "password": "Doctor@135"})
results.append(f"4.DoctorLogin: {code}")

# 5. Patient Profile
if pt:
    code, body = post_json_auth("/patient/profile", {"name": "Test", "age": 30, "gender": "Male", "weight": 70.0, "blood_group": "O+", "existing_diseases": "None", "allergies": "None", "contact_info": "123"}, pt)
    results.append(f"5.PatientProfile: {code}")

# 6. AI Assessment
if pt:
    code, body = post_json_auth("/patient/assessment", {"fever": True, "heart_rate_high": True, "rapid_breathing": False, "confusion": False, "infection_history": True, "low_blood_pressure_symptoms": False, "recent_surgery_injury": False}, pt)
    results.append(f"6.AIAssessment: {code} risk={body.get('risk_level','?')} summary={body.get('symptoms_summary','?')[:60]}")

for r in results:
    print(r)
