import sqlite3

def check_users():
    try:
        conn = sqlite3.connect('sepsis_app.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role FROM users")
        users = cursor.fetchall()
        print("Existing Users:")
        for u in users:
            print(f"ID: {u[0]}, Email: {u[1]}, Role: {u[2]}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
