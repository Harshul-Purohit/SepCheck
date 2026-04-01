from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any

# Authentication
class UserCreate(BaseModel):
    email: str
    password: str
    role: str # 'patient' or 'doctor'

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

# Profiles
class PatientProfileCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    weight: float
    height: float
    blood_group: str
    blood_pressure: str
    heart_rate: int
    temperature: float
    existing_diseases: Optional[str] = None
    allergies: Optional[str] = None
    contact_info: str


class PatientProfileResponse(PatientProfileCreate):
    id: int
    user_id: int
    class Config:
        orm_mode = True
        from_attributes = True

class DoctorProfileCreate(BaseModel):
    name: str
    age: int
    gender: str
    qualification: str
    specialization: str
    experience: int
    hospital_details: str
    location: str
    contact_number: str
    email: str

class DoctorProfileResponse(DoctorProfileCreate):
    id: int
    user_id: int
    is_verified: bool
    class Config:
        orm_mode = True
        from_attributes = True

# Reports and Forms
class SepsisQuestionnaire(BaseModel):
    fever: bool
    heart_rate_high: bool
    rapid_breathing: bool
    confusion: bool
    infection_history: bool
    low_blood_pressure_symptoms: bool
    recent_surgery_injury: bool
    additional_notes: Optional[str] = None
    is_doctor_suggested: Optional[bool] = False

class SepsisReportResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int]
    questionnaire_data: dict
    risk_level: str
    probability_score: float
    symptoms_summary: str
    explanation: str
    abnormal_values: List[str]
    urgency_level: str
    recommendations: str
    
    # Inner Analysis Fields
    suggested_tests: Optional[List[str]] = None
    inner_analysis_summary: Optional[str] = None
    inner_analysis_data: Optional[dict] = None
    is_doctor_suggested: bool
    
    class Config:
        orm_mode = True
        from_attributes = True

class RecommendationResponse(BaseModel):
    doctor_id: int
    doctor_name: str
    specialization: str
    experience: int
    hospital: str

# Consultations
class ConsultationRequestCreate(BaseModel):
    report_id: int
    severity: str

class ConsultationUpdate(BaseModel):
    status: str # accepted, rejected, completed
    appointment_time: Optional[str] = None
    hospital: Optional[str] = None
    required_tests: Optional[List[str]] = None
    doctor_notes: Optional[str] = None
    prescribed_tests_meds: Optional[str] = None

class ConsultationResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int]
    report_id: int
    status: str
    severity: str
    appointment_time: Optional[str]
    hospital: Optional[str]
    required_tests: Optional[List[str]]
    doctor_notes: Optional[str]
    prescribed_tests_meds: Optional[str]
    created_at: Any
    
    class Config:
        orm_mode = True
        from_attributes = True

# Chat and Emergency
class ChatMessageCreate(BaseModel):
    consultation_id: int
    message: str

class ChatMessage(BaseModel):
    id: int
    consultation_id: int
    sender_id: int
    message: str
    created_at: Any
    
    class Config:
        orm_mode = True
        from_attributes = True

class EmergencyRequestCreate(BaseModel):
    report_id: int

class EmergencyRequestResponse(BaseModel):
    id: int
    patient_id: int
    report_id: int
    status: str
    created_at: Any
    patient_name: Optional[str] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

class AIChatRequest(BaseModel):
    report_id: int
    message: str
    history: Optional[List[dict]] = []
