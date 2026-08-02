import urllib.parse
from sqlalchemy import create_engine

passwords_to_try = [
    "Sainu%40123", # URL-encoded: Sainu@123
    "sainu%40123", # URL-encoded: sainu@123
    "postgres",
    "admin",
    "root",
    "",
]

for pwd in passwords_to_try:
    url = f"postgresql://postgres:{pwd}@127.0.0.1:5432/urbanflow"
    print(f"Testing password: {'(blank)' if not pwd else pwd}")
    try:
        engine = create_engine(url)
        conn = engine.connect()
        print(f"--> SUCCESS! Password is: {pwd}\n")
        conn.close()
        break
    except Exception as e:
        print(f"--> FAILED: {str(e)[:120]}...\n")
