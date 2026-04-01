from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'patient' or 'doctor'
    is_active = Column(Boolean, default=True)

    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False)
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    chat_messages = relationship("ChatMessage", back_populates="sender")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    full_name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    weight = Column(Float)
    height = Column(Float)
    blood_group = Column(String)
    blood_pressure = Column(String)
    heart_rate = Column(Integer)
    temperature = Column(Float)
    existing_diseases = Column(String)
    allergies = Column(String)
    contact_info = Column(String)


    user = relationship("User", back_populates="patient_profile")
    reports = relationship("SepsisReport", back_populates="patient")
    consultations = relationship("ConsultationRequest", back_populates="patient")
    emergency_requests = relationship("EmergencyRequest", back_populates="patient")

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    name = Column(String)
    age = Column(Integer) # New field
    gender = Column(String) # New field
    qualification = Column(String)
    specialization = Column(String)
    experience = Column(Integer)
    hospital_details = Column(Text) # Hospital/Clinic Name
    location = Column(String) # New field
    contact_number = Column(String) # New field
    email = Column(String) # New field
    is_verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="doctor_profile")
    assigned_reports = relationship("SepsisReport", back_populates="doctor")
    consultations = relationship("ConsultationRequest", back_populates="doctor")

class SepsisReport(Base):
    __tablename__ = "sepsis_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"))
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=True) # Assigned doctor
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Raw input data
    questionnaire_data = Column(JSON) # Store symptoms, fever, HR etc.
    medical_test_results = Column(JSON, nullable=True) # Extracted OCR values from report upload
    
    # AI Output
    risk_level = Column(String) # Low, Medium, High
    probability_score = Column(Float)
    symptoms_summary = Column(Text)
    explanation = Column(Text)
    abnormal_values = Column(JSON)
    urgency_level = Column(String) # Immediate, Within 24 hours, Monitor
    recommendations = Column(Text)
    
    patient = relationship("PatientProfile", back_populates="reports")
    doctor = relationship("DoctorProfile", back_populates="assigned_reports")
    consultations = relationship("ConsultationRequest", back_populates="report")

class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"))
    doctor_id = Column(Integer, ForeignKey("doctor_profiles.id"), nullable=True) # Selected doctor
    report_id = Column(Integer, ForeignKey("sepsis_reports.id"))
    
    status = Column(String, default="pending") # pending, accepted, rejected, completed
    severity = Column(String) # High, Medium, Low
    appointment_time = Column(String, nullable=True)
    hospital = Column(String, nullable=True)
    required_tests = Column(JSON, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patient = relationship("PatientProfile", back_populates="consultations")
    doctor = relationship("DoctorProfile", back_populates="consultations")
    report = relationship("SepsisReport", back_populates="consultations")
    chat_messages = relationship("ChatMessage", back_populates="consultation")

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"))
    report_id = Column(Integer, ForeignKey("sepsis_reports.id"))
    
    status = Column(String, default="active") # active, handled
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("PatientProfile", back_populates="emergency_requests")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultation_requests.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    consultation = relationship("ConsultationRequest", back_populates="chat_messages")
    sender = relationship("User", back_populates="chat_messages")
