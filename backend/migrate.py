import sqlite3

db_path = r'c:\Users\Lenovo\OneDrive\Desktop\sepcheck new\SepCheck\backend\sepsis_app.db'

def add_column(table, column, definition):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        conn.commit()
        conn.close()
        print(f"Added {column} to {table}")
    except Exception as e:
        print(f"Error adding {column} to {table}: {e}")

add_column('sepsis_reports', 'is_doctor_suggested', 'BOOLEAN DEFAULT 0')
add_column('consultation_requests', 'prescribed_tests_meds', 'TEXT')
