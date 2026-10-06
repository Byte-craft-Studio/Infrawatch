import os
import firebase_admin
from firebase_admin import credentials, firestore

db = None

def init_firebase():
    global db
    if firebase_admin._apps:
        db = firestore.client()
        return

    cred_path = os.getenv("FIREBASE_CREDENTIALS", "serviceAccountKey.json")

    if not os.path.exists(cred_path):
        print("[firebase] No credentials found. Running in mock mode.")
        return

    try:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("[firebase] Firebase initialized.")
    except Exception as e:
        print(f"[firebase] Failed to initialize: {e}")
        print("[firebase] Running in mock mode.")

init_firebase()

# Mock data store for testing
_mock_reports = {
    "test123": {"id": "test123", "type": "pothole", "status": "pending"}
}

def get_report(report_id: str):
    if db is None:
        return _mock_reports.get(report_id)
    doc = db.collection("reports").document(report_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

def update_report_status(report_id: str, status: str):
    if db is None:
        if report_id in _mock_reports:
            _mock_reports[report_id]["status"] = status
            return _mock_reports[report_id]
        return None
    db.collection("reports").document(report_id).update({"status": status})
    return get_report(report_id)