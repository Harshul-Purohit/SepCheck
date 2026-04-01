from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
import io

def generate_medical_report_pdf(patient_name, report):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    c.setFillColor(colors.teal)
    c.rect(0, height - 1.5*inch, width, 1.5*inch, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(inch, height - inch, "SepCheck AI REPORT")
    
    c.setFont("Helvetica", 12)
    c.drawString(inch, height - 1.3*inch, f"Official clinical analysis for {patient_name}")

    # Reset text color
    c.setFillColor(colors.black)
    
    # Report Meta
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inch, height - 2*inch, "Patient Information")
    c.line(inch, height - 2.05*inch, width - inch, height - 2.05*inch)
    
    c.setFont("Helvetica", 10)
    c.drawString(inch, height - 2.3*inch, f"Name: {patient_name}")
    c.drawString(inch, height - 2.5*inch, f"Report ID: #{report.id + 1000}")
    c.drawString(inch, height - 2.7*inch, f"Date: {report.created_at.strftime('%Y-%m-%d %H:%M')}")

    # Risk Analysis
    risk_color = colors.green
    if report.risk_level == "High":
        risk_color = colors.red
    elif report.risk_level == "Medium":
        risk_color = colors.orange

    c.setFillColor(risk_color)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 3.5*inch, f"RISK LEVEL: {report.risk_level.upper()}")
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 11)
    c.drawCentredString(width / 2, height - 3.8*inch, f"AI Confidence: {int(report.probability_score * 100)}%")

    # Symptoms Summary
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inch, height - 4.5*inch, "Clinical Summary & AI Insights")
    c.line(inch, height - 4.55*inch, width - inch, height - 4.55*inch)
    
    c.setFont("Helvetica", 10)
    text_object = c.beginText(inch, height - 4.8*inch)
    text_object.setFont("Helvetica", 10)
    text_object.setLeading(14)
    
    # Wrap symptoms summary manually for simplicity (better: use platypus for complex wrap)
    summary = report.symptoms_summary
    words = summary.split()
    line = ""
    for word in words:
        if c.stringWidth(line + word) < (width - 2*inch):
            line += word + " "
        else:
            text_object.textLine(line)
            line = word + " "
    text_object.textLine(line)
    
    c.drawText(text_object)

    # Abnormal Values
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inch, height - 6.5*inch, "Abnormal Indicators Detected")
    c.setFont("Helvetica", 10)
    y = height - 6.8 * inch
    for val in report.abnormal_values:
        c.drawString(inch + 0.2*inch, y, f"• {val}")
        y -= 0.2 * inch

    # Urgency & Recommendation
    c.setFillColor(colors.teal)
    c.rect(inch, 2.5*inch, width - 2*inch, 1.2*inch, fill=1, stroke=0)
    c.setFillColor(colors.white)
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(inch + 0.2*inch, 3.5*inch, f"URGENCY: {report.urgency_level}")
    
    text_object = c.beginText(inch + 0.2*inch, 3.3*inch)
    text_object.setFont("Helvetica", 9)
    text_object.setLeading(11)
    
    rec_text = f"RECOMMENDATIONS: {report.recommendations}"
    words = rec_text.split()
    line = ""
    for word in words:
        if c.stringWidth(line + word) < (width - 2.8*inch):
            line += word + " "
        else:
            text_object.textLine(line)
            line = word + " "
    text_object.textLine(line)
    c.drawText(text_object)

    # Next Steps / Suggested Tests
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(inch, 2.1*inch, "Suggested Diagnostic Tests (Immediate Priority)")
    c.line(inch, 2.05*inch, width-inch, 2.05*inch)
    
    c.setFont("Helvetica", 10)
    tests = ", ".join(report.suggested_tests) if report.suggested_tests else "None specified."
    c.drawString(inch, 1.85*inch, tests)

    # Inner Analysis results if present
    if report.inner_analysis_summary:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(inch, 1.5*inch, "Inner Clinical Analysis (Linked Lab Report)")
        c.line(inch, 1.45*inch, width-inch, 1.45*inch)
        
        c.setFont("Helvetica-Oblique", 9)
        text_object = c.beginText(inch, 1.3*inch)
        text_object.setLeading(11)
        summary = report.inner_analysis_summary
        words = summary.split()
        line = ""
        for word in words:
            if c.stringWidth(line + word) < (width - 2*inch):
                line += word + " "
            else:
                text_object.textLine(line)
                line = word + " "
        text_object.textLine(line)
        c.drawText(text_object)

    # Footer
    c.setFillColor(colors.grey)
    c.setFont("Helvetica-Oblique", 8)
    c.drawCentredString(width / 2, 0.5*inch, "This report is generated by SepCheck AI and should be reviewed by a qualified medical professional.")

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer
