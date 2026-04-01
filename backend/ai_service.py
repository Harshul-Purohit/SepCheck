import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv() # Load from .env

# Initialize Groq client
# the API key will be passed directly for this hackathon
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_sepsis_risk(patient_data: dict, questionnaire: dict):
    prompt_content = f"""
    You are an expert AI medical assistant specializing in early detection of Sepsis.
    Analyze the following patient data and symptom questionnaire to determine the risk of Sepsis.
    
    Patient Profile (Vitals):
    - Age: {patient_data.get('age', 'N/A')}
    - Gender: {patient_data.get('gender', 'N/A')}
    - Weight: {patient_data.get('weight', 'N/A')} kg
    - Height: {patient_data.get('height', 'N/A')} cm
    - Blood Pressure: {patient_data.get('blood_pressure', 'N/A')} mmHg
    - Heart Rate: {patient_data.get('heart_rate', 'N/A')} bpm
    - Temperature: {patient_data.get('temperature', 'N/A')} °F
    - Existing Diseases: {patient_data.get('existing_diseases', 'None')}
    - Allergies: {patient_data.get('allergies', 'None')}
    
    Questionnaire Responses:
    - Fever Symptoms: {questionnaire.get('fever', False)}
    - High Heart Rate (>100 bpm): {questionnaire.get('heart_rate_high', False)}
    - Rapid Breathing (>20 breaths/min): {questionnaire.get('rapid_breathing', False)}
    - Patient Confusion: {questionnaire.get('confusion', False)}
    - History of Infection: {questionnaire.get('infection_history', False)}
    - Low Blood Pressure Signs: {questionnaire.get('low_blood_pressure_symptoms', False)}
    - Recent Surgery or Injury: {questionnaire.get('recent_surgery_injury', False)}
    - Additional Notes: {questionnaire.get('additional_notes', '')}
    
    Provide your analysis EXCLUSIVELY in valid JSON format with the following keys:
    {{
        "risk_level": "Low" | "Medium" | "High",
        "probability_score": <float between 0 and 1>,
        "symptoms_summary": "<A 2-3 sentence summary of the key symptoms and concern level>",
        "explanation": "<A short clinical explanation for why this risk level was chosen based on the vitals and answers>",
        "abnormal_values": ["<list of abnormal indicators like 'High Heart Rate', 'Low BP'>", ...],
        "urgency_level": "Immediate" | "Within 24 hours" | "Monitor",
        "recommendations": "<short actionable clinical recommendations for the patient>"
    }}
    Do not include any markdown tags or text outside of the JSON object.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt_content,
                }
            ],
            model="llama-3.3-70b-versatile", # upgraded to versatile non-deprecated target
            temperature=0.2, # keep it deterministic
            response_format={"type": "json_object"}
        )
        
        # Parse JSON
        result = json.loads(chat_completion.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        # Return fallback safe response
        return {
            "risk_level": "Unknown",
            "probability_score": 0.0,
            "symptoms_summary": "Error generating analysis.",
            "explanation": str(e),
            "abnormal_values": [],
            "urgency_level": "Monitor",
            "recommendations": "Please consult a doctor manually."
        }

def get_ai_followup_response(report_data: dict, user_question: str, history: list = []):
    # Prepare context from report
    context = f"""
    SEPSIS ASSESSMENT REPORT CONTEXT:
    - Risk Level: {report_data.get('risk_level')}
    - Probability: {report_data.get('probability_score')}
    - Summary: {report_data.get('symptoms_summary')}
    - Abnormalities: {', '.join(report_data.get('abnormal_values', []))}
    - Recommendations: {report_data.get('recommendations')}
    """
    
    messages = [
        {"role": "system", "content": "You are a helpful medical AI assistant. Answer the user's questions about their sepsis assessment report based on the provided context. Be professional, empathetic, and clear. If you don't know something, advise consulting a professional."},
    ]
    
    # Add history
    for msg in history:
        messages.append(msg)
        
    # Add current context and question
    messages.append({"role": "user", "content": f"{context}\n\nUser Question: {user_question}"})
    
    try:
        completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"I'm sorry, I'm having trouble connecting to the AI service. error: {str(e)}"
