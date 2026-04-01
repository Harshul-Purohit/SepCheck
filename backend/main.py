from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
import models, schemas, crud, auth, database, ai_service, pdf_service
from database import engine

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SepCheck Medical AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handling utility for unauthorized access
def get_current_user_with_role(role: str):
    def role_checker(current_user: models.User = Depends(auth.get_current_user)):
        if current_user.role != role:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return role_checker

@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = crud.create_user(db=db, user=user)
    
    # Generate token immediately
    access_token = auth.create_access_token(
        data={"sub": new_user.email, "role": new_user.role},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role, "user_id": new_user.id}

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.id}

# --- Patient APIs ---

@app.post("/patient/profile", response_model=schemas.PatientProfileResponse)
def create_patient_profile(profile: schemas.PatientProfileCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    existing = crud.get_patient_profile(db, current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    return crud.create_patient_profile(db, profile, current_user.id)

@app.get("/patient/profile", response_model=schemas.PatientProfileResponse)
def get_my_patient_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.post("/patient/upload")
def upload_lab_tests(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user_with_role("patient"))
):
    profile = crud.get_patient_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your profile first")
    
    import time
    time.sleep(1) # Simulate OCR
    
    mocked_extracted_data = {
        "fever": True,
        "heart_rate_high": True,
        "rapid_breathing": True,
        "confusion": False,
        "infection_history": True,
        "low_blood_pressure_symptoms": False,
        "recent_surgery_injury": False
    }
    
    return {
        "message": f"Clinical data extracted from {file.filename}.",
        "extracted_data": mocked_extracted_data
    }

@app.post("/patient/assessment", response_model=schemas.SepsisReportResponse)
def submit_assessment(questionnaire: schemas.SepsisQuestionnaire, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Please complete your profile first")

    # Patient Data summary
    patient_data = {
        "age": profile.age,
        "gender": profile.gender,
        "weight": profile.weight,
        "height": profile.height,
        "blood_pressure": profile.blood_pressure,
        "heart_rate": profile.heart_rate,
        "temperature": profile.temperature,
        "existing_diseases": profile.existing_diseases,
        "allergies": profile.allergies
    }

    # Call AI Service with error handling
    try:
        ai_result = ai_service.analyze_sepsis_risk(patient_data, questionnaire.dict())
    except Exception as e:
        print(f"AI ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="AI Service Busy")
    
    # Save to db
    report = crud.create_sepsis_report(db, profile.id, questionnaire.dict(), ai_result)
    return report

@app.get("/patient/reports", response_model=List[schemas.SepsisReportResponse])
def get_my_reports(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    if not profile:
        return []
    return crud.get_patient_reports(db, profile.id)

@app.get("/patient/report/{report_id}/pdf")
def download_patient_report_pdf(report_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    report = db.query(models.SepsisReport).filter(models.SepsisReport.id == report_id).first()
    if not report or report.patient_id != profile.id:
        raise HTTPException(status_code=404, detail="Report not found")
        
    pdf_buffer = pdf_service.generate_medical_report_pdf(profile.full_name, report)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=sepcheck_report_{report_id}.pdf"})

@app.post("/patient/report/{report_id}/upload-diagnostic", response_model=schemas.SepsisReportResponse)
async def upload_diagnostic_report(
    report_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user_with_role("patient"))
):
    report = db.query(models.SepsisReport).filter(models.SepsisReport.id == report_id).first()
    profile = crud.get_patient_profile(db, current_user.id)
    
    if not report or report.patient_id != profile.id:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Read file content (Mock OCR for simplicity)
    content = await file.read()
    text_content = content.decode('utf-8', errors='ignore') # In reality, use OCR
    
    if not text_content.strip():
        text_content = "Mock report content: WBC 15,000, Lactate 4.2, Blood Culture Positive for E. Coli."

    # Analyze with AI
    try:
        analysis = ai_service.analyze_diagnostic_report(text_content)
    except Exception as e:
        print(f"DIAGNOSTIC AI ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(e)}")
    
    # Update report
    report.inner_analysis_summary = analysis.get('analysis_summary', 'Analysis completed with no summary.')
    report.inner_analysis_data = analysis
    
    try:
        db.commit()
        db.refresh(report)
    except Exception as e:
        db.rollback()
        print(f"DATABASE UPDATE ERROR: {e}")
        raise HTTPException(status_code=500, detail="Failed to save analysis to database.")
        
    return report

@app.get("/patient/recommendations", response_model=List[schemas.RecommendationResponse])
def get_doctor_recommendations(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    doctors = crud.get_doctors(db)
    result = []
    for d in doctors:
        result.append({
            "doctor_id": d.id,
            "doctor_name": d.name,
            "specialization": d.specialization,
            "experience": d.experience,
            "hospital": d.hospital_details
        })
    return result

@app.post("/consult/request", response_model=schemas.ConsultationResponse)
def request_consultation(consult: schemas.ConsultationRequestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    return crud.create_consultation(db, profile.id, consult)

@app.get("/patient/consultations", response_model=List[schemas.ConsultationResponse])
def get_my_consultations(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    return crud.get_patient_consultations(db, profile.id)

# --- Doctor APIs ---

@app.post("/doctor/profile", response_model=schemas.DoctorProfileResponse)
def create_doctor_profile(profile: schemas.DoctorProfileCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("doctor"))):
    existing = crud.get_doctor_profile(db, current_user.id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    db_profile = crud.create_doctor_profile(db, profile, current_user.id)
    db_profile.is_verified = True 
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.get("/doctor/profile", response_model=schemas.DoctorProfileResponse)
def get_my_doctor_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("doctor"))):
    profile = crud.get_doctor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.get("/doctor/reports", response_model=List[schemas.SepsisReportResponse])
def get_all_reports_for_doctor(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("doctor"))):
    return crud.get_all_reports(db)

@app.get("/doctor/consultations", response_model=List[schemas.ConsultationResponse])
def get_doctor_consultations(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("doctor"))):
    return crud.get_all_consultations_for_doctor(db)

@app.post("/consult/respond/{consult_id}", response_model=schemas.ConsultationResponse)
def respond_to_consultation(consult_id: int, update: schemas.ConsultationUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("doctor"))):
    doctor_profile = crud.get_doctor_profile(db, current_user.id)
    return crud.update_consultation(db, consult_id, doctor_profile.id, update)

# --- Emergency & Chat APIs ---

@app.post("/patient/emergency", response_model=schemas.EmergencyRequestResponse)
def trigger_emergency(req: schemas.EmergencyRequestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    profile = crud.get_patient_profile(db, current_user.id)
    return crud.create_emergency_request(db, profile.id, req.report_id)

@app.get("/doctor/emergencies", response_model=List[schemas.EmergencyRequestResponse])
def get_emergencies(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("doctor"))):
    return crud.get_active_emergencies(db)

@app.post("/chat/send", response_model=schemas.ChatMessage)
def send_message(msg: schemas.ChatMessageCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_chat_message(db, msg.consultation_id, current_user.id, msg.message)

@app.get("/chat/history/{consultation_id}", response_model=List[schemas.ChatMessage])
def get_history(consultation_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_chat_history(db, consultation_id)

@app.post("/ai/chat-followup")
def ai_followup(req: schemas.AIChatRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_with_role("patient"))):
    report = db.query(models.SepsisReport).filter(models.SepsisReport.id == req.report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Standardize data for AI
    report_data = {
        "risk_level": report.risk_level,
        "probability_score": report.probability_score,
        "symptoms_summary": report.symptoms_summary,
        "abnormal_values": report.abnormal_values,
        "recommendations": report.recommendations
    }
    
    response = ai_service.get_ai_followup_response(report_data, req.message, req.history)
    return {"response": response}

@app.get("/")
def read_root():
    return {"message": "SepCheck AI API - Health Ready"}
