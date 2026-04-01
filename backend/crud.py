from sqlalchemy.orm import Session
import models, schemas, auth

# User CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Patient Profile
def get_patient_profile(db: Session, user_id: int):
    return db.query(models.PatientProfile).filter(models.PatientProfile.user_id == user_id).first()

def create_patient_profile(db: Session, profile, user_id: int):
    db_profile = models.PatientProfile(
        user_id=user_id,
        full_name=profile.full_name,
        age=profile.age,
        gender=profile.gender,
        weight=profile.weight,
        height=profile.height,
        blood_group=profile.blood_group,
        blood_pressure=profile.blood_pressure,
        heart_rate=profile.heart_rate,
        temperature=profile.temperature,
        existing_diseases=profile.existing_diseases,
        allergies=profile.allergies,
        contact_info=profile.contact_info
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


# Doctor Profile
def get_doctor_profile(db: Session, user_id: int):
    return db.query(models.DoctorProfile).filter(models.DoctorProfile.user_id == user_id).first()

def create_doctor_profile(db: Session, profile: schemas.DoctorProfileCreate, user_id: int):
    db_profile = models.DoctorProfile(
        user_id=user_id,
        name=profile.name,
        age=profile.age,
        gender=profile.gender,
        qualification=profile.qualification,
        specialization=profile.specialization,
        experience=profile.experience,
        hospital_details=profile.hospital_details,
        location=profile.location,
        contact_number=profile.contact_number,
        email=profile.email
    )
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

# Reports
def create_sepsis_report(db: Session, patient_id: int, questionnaire_data: dict, ai_analysis: dict):
    db_report = models.SepsisReport(
        patient_id=patient_id,
        questionnaire_data=questionnaire_data,
        risk_level=ai_analysis.get('risk_level', 'Unknown'),
        probability_score=ai_analysis.get('probability_score', 0.0),
        symptoms_summary=ai_analysis.get('symptoms_summary', ''),
        explanation=ai_analysis.get('explanation', ''),
        abnormal_values=ai_analysis.get('abnormal_values', []),
        urgency_level=ai_analysis.get('urgency_level', 'Monitor'),
        recommendations=ai_analysis.get('recommendations', ''),
        suggested_tests=ai_analysis.get('suggested_tests', []) # Save AI suggested tests
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_patient_reports(db: Session, patient_id: int):
    return db.query(models.SepsisReport).filter(models.SepsisReport.patient_id == patient_id).order_by(models.SepsisReport.created_at.desc()).all()

def get_all_reports(db: Session):
    return db.query(models.SepsisReport).order_by(models.SepsisReport.created_at.desc()).all()

def get_doctors(db: Session):
    return db.query(models.DoctorProfile).filter(models.DoctorProfile.is_verified == True).all()

# Consultations
def create_consultation(db: Session, patient_id: int, consultation: schemas.ConsultationRequestCreate):
    db_consult = models.ConsultationRequest(
        patient_id=patient_id,
        report_id=consultation.report_id,
        severity=consultation.severity,
        status="pending"
    )
    db.add(db_consult)
    db.commit()
    db.refresh(db_consult)
    return db_consult

def get_patient_consultations(db: Session, patient_id: int):
    return db.query(models.ConsultationRequest).filter(models.ConsultationRequest.patient_id == patient_id).all()

def get_all_consultations_for_doctor(db: Session):
    # For hackathon, allow doctors to see all pending consults
    return db.query(models.ConsultationRequest).order_by(models.ConsultationRequest.created_at.desc()).all()

def update_consultation(db: Session, consult_id: int, doctor_id: int, update: schemas.ConsultationUpdate):
    db_consult = db.query(models.ConsultationRequest).filter(models.ConsultationRequest.id == consult_id).first()
    if not db_consult:
        return None
    
    db_consult.doctor_id = doctor_id
    db_consult.status = update.status
    if update.appointment_time:
        db_consult.appointment_time = update.appointment_time
    if update.hospital:
        db_consult.hospital = update.hospital
    if update.required_tests:
        db_consult.required_tests = update.required_tests
    if update.doctor_notes:
        db_consult.doctor_notes = update.doctor_notes
        
    db.commit()
    db.refresh(db_consult)
    return db_consult

# Emergency and Chat CRUD
def create_emergency_request(db: Session, patient_id: int, report_id: int):
    # Check if active one exists
    active = db.query(models.EmergencyRequest).filter(
        models.EmergencyRequest.patient_id == patient_id,
        models.EmergencyRequest.status == "active"
    ).first()
    if active:
        return active
        
    db_emergency = models.EmergencyRequest(
        patient_id=patient_id,
        report_id=report_id,
        status="active"
    )
    db.add(db_emergency)
    db.commit()
    db.refresh(db_emergency)
    return db_emergency

def get_active_emergencies(db: Session):
    emergencies = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.status == "active").all()
    # Map to include patient name for convenience
    for e in emergencies:
        e.patient_name = e.patient.full_name
    return emergencies

def create_chat_message(db: Session, consultation_id: int, sender_id: int, message: str):
    db_message = models.ChatMessage(
        consultation_id=consultation_id,
        sender_id=sender_id,
        message=message
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_history(db: Session, consultation_id: int):
    return db.query(models.ChatMessage).filter(models.ChatMessage.consultation_id == consultation_id).order_by(models.ChatMessage.created_at.asc()).all()
