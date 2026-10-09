from flask import Flask, jsonify, request
import mysql.connector

app = Flask(__name__)


# =========================
# MySQL Connection
# =========================

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="root",
    database="campuspulse_ai"
)


# =========================
# CORS
# =========================

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# =========================
# Home
# =========================

@app.route("/")
def home():
    return "CampusPulse AI Backend is Running!"


# =========================
# Analyze + Save Complaint
# =========================

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():

    if request.method == "OPTIONS":
        return jsonify({
            "message": "CORS OK"
        }), 200

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received"
        }), 400

    # Get form data
    student_name = data.get("student_name") or "Student"
    location = data.get("location") or "Not Specified"
    description = data.get("description", "").lower()

    if request.method == "OPTIONS":
        return jsonify({
            "message": "CORS OK"
        }), 200

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No data received"
        }), 400

    # Get form data
    student_name = data.get("student_name") or "Student"
    location = data.get("location") or "Not Specified"
    description = data.get("description", "").lower()
    # =========================
    # Category Detection
    # =========================

    if "wifi" in description or "internet" in description or "network" in description:
        category = "Wi-Fi"
        department = "IT Department"

    elif "light" in description or "fan" in description or "electric" in description:
        category = "Electrical"
        department = "Electrical Maintenance"

    elif "water" in description or "tap" in description or "pipe" in description:
        category = "Water"
        department = "Maintenance"

    elif "chair" in description or "desk" in description or "table" in description:
        category = "Furniture"
        department = "Maintenance"

    elif "computer" in description or "pc" in description or "lab" in description:
        category = "Lab"
        department = "Lab Maintenance"

    elif "clean" in description or "dust" in description or "garbage" in description:
        category = "Cleaning"
        department = "Cleaning Department"

    else:
        category = category_input if category_input else "Other"
        department = "General Maintenance"


    # =========================
    # Priority Detection
    # =========================

    if (
        "fire" in description
        or "danger" in description
        or "emergency" in description
        or "critical" in description
    ):
        priority = "Critical"

    elif (
        "broken" in description
        or "not working" in description
        or "damage" in description
    ):
        priority = "High"

    elif (
        "problem" in description
        or "issue" in description
        or "slow" in description
    ):
        priority = "Medium"

    else:
        priority = "Low"


    # =========================
    # Save Complaint in MySQL
    # =========================

    cursor = db.cursor()

    cursor.execute("""
        INSERT INTO complaints
        (
            student_name,
            category,
            location,
            description,
            priority,
            department,
            status
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        student_name,
        category,
        location,
        description,
        priority,
        department,
        "Submitted"
    ))

    db.commit()
    cursor.close()


    # =========================
    # Send Result
    # =========================

    return jsonify({
        "message": "Complaint saved successfully",
        "category": category,
        "priority": priority,
        "department": department
    })


# =========================
# Get Complaints
# =========================

@app.route("/complaints", methods=["GET"])
def get_complaints():

    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            complaint_id,
            student_name,
            category,
            location,
            description,
            priority,
            department,
            status,
            created_at
        FROM complaints
        ORDER BY complaint_id DESC
    """)

    complaints = cursor.fetchall()

    cursor.close()

    return jsonify(complaints)


# =========================
# Run Flask
# =========================
@app.route("/complaint-stats", methods=["GET"])
def complaint_stats():
    cursor = db.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) AS submitted,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved
        FROM complaints
    """)

    stats = cursor.fetchone()
    cursor.close()

    return jsonify({
        "total": stats["total"] or 0,
        "submitted": stats["submitted"] or 0,
        "in_progress": stats["in_progress"] or 0,
        "resolved": stats["resolved"] or 0
    })
if __name__ == "__main__":
    app.run(debug=True)