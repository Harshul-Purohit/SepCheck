import sqlite3
import bcrypt

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def reset_passwords():
    new_hashed = get_password_hash('12345678')
    try:
        conn = sqlite3.connect('sepsis_app.db')
        cursor = conn.cursor()
        
        # Reset all passwords to '12345678'
        cursor.execute("UPDATE users SET password_hash = ?", (new_hashed,))
        conn.commit()
        
        print(f"Update Success: {cursor.rowcount} users updated.")
        
        cursor.execute("SELECT email, role FROM users")
        for u in cursor.fetchall():
            print(f"Login Email: {u[0]} ({u[1]}) | Pass: 12345678")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_passwords()
