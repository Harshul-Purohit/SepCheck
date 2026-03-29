import json
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv() # Load from .env

c = Groq(api_key=os.getenv("GROQ_API_KEY"))
try:
    r = c.chat.completions.create(
        messages=[{"role": "user", "content": "Return JSON: {\"test\": true}"}],
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    print("SUCCESS:", r.choices[0].message.content)
except Exception as e:
    print("ERROR TYPE:", type(e).__name__)
    print("ERROR:", e)
