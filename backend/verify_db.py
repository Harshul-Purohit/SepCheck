import sqlite3
import os

db_path = r'c:\Users\Lenovo\OneDrive\Desktop\sepcheck new\SepCheck\backend\sepsis_app.db'

def check_columns(table_name):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [row[1] for row in cursor.fetchall()]
    conn.close()
    return columns

print(f"Columns in sepsis_reports: {check_columns('sepsis_reports')}")
print(f"Columns in consultation_requests: {check_columns('consultation_requests')}")
