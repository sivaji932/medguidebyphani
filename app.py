from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import json
import hashlib
import re
import base64
from PIL import Image
import io
import requests
import os

app = Flask(__name__)
CORS(app)

# Database configuration
# For serverless, we'll use an in-memory database or external database
if os.environ.get('VERCEL'):
    # Use in-memory SQLite for Vercel (temporary solution)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
else:
    # Use file-based SQLite for local development
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///medicine_guide.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
# Use /tmp for Vercel, uploads for local development
app.config['UPLOAD_FOLDER'] = os.environ.get('UPLOAD_FOLDER', 'uploads')

db = SQLAlchemy(app)

# Complete your database models
class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    generic_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    dosage_forms = db.Column(db.Text)  # JSON string
    indications = db.Column(db.Text)
    contraindications = db.Column(db.Text)
    side_effects = db.Column(db.Text)
    precautions = db.Column(db.Text)
    interactions = db.Column(db.Text)  # JSON string
    dosage_info = db.Column(db.Text)  # JSON string
    category = db.Column(db.String(50))
    manufacturer = db.Column(db.String(100))
    image_url = db.Column(db.String(200))
    diseases_treated = db.Column(db.Text)  # JSON string
    severity_level = db.Column(db.String(20))  # mild, moderate, severe
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Add the missing models
class Disease(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    symptoms = db.Column(db.Text)  # JSON string
    severity = db.Column(db.String(20))
    treatment_info = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SymptomChecker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    symptoms = db.Column(db.Text, nullable=False)  # JSON string
    predicted_diseases = db.Column(db.Text)  # JSON string
    confidence_score = db.Column(db.Float)
    user_age = db.Column(db.Integer)
    user_gender = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MedicalConsultation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(10))
    symptoms = db.Column(db.Text)
    diagnosis = db.Column(db.Text)
    recommended_medicines = db.Column(db.Text)  # JSON string
    consultation_date = db.Column(db.DateTime, default=datetime.utcnow)
    doctor_notes = db.Column(db.Text)

# Implement the missing functions
def analyze_symptoms(symptoms_text):
    """Analyze symptoms and predict possible diseases"""
    # Basic implementation - you can enhance this with actual AI/ML
    symptoms = symptoms_text.lower().split(',')
    
    # Simple keyword matching (replace with actual AI logic)
    disease_keywords = {
        'fever': ['Common Cold', 'Flu', 'Malaria'],
        'headache': ['Migraine', 'Tension Headache', 'Cluster Headache'],
        'cough': ['Common Cold', 'Bronchitis', 'Pneumonia'],
        'nausea': ['Food Poisoning', 'Gastritis', 'Motion Sickness']
    }
    
    predicted_diseases = []
    for symptom in symptoms:
        symptom = symptom.strip()
        for key, diseases in disease_keywords.items():
            if key in symptom:
                predicted_diseases.extend(diseases)
    
    return list(set(predicted_diseases))  # Remove duplicates

def analyze_uploaded_image(image_data):
    """Analyze uploaded image for visual symptoms"""
    # Placeholder implementation
    # In a real application, you would use computer vision/AI
    return {
        'analysis': 'Image analysis not implemented yet',
        'suggestions': ['Consult a healthcare professional for proper diagnosis']
    }

def get_medicine_recommendations(disease, age, weight, severity='mild'):
    """Get medicine recommendations based on disease and patient info"""
    # Simple recommendation logic (replace with actual medical database)
    recommendations = {
        'Common Cold': {
            'medicines': ['Paracetamol', 'Cough Syrup'],
            'dosage': 'As per doctor prescription',
            'precautions': 'Take with food, avoid alcohol'
        },
        'Fever': {
            'medicines': ['Paracetamol', 'Ibuprofen'],
            'dosage': 'Every 6-8 hours',
            'precautions': 'Monitor temperature regularly'
        }
    }
    
    return recommendations.get(disease, {
        'medicines': ['Consult doctor'],
        'dosage': 'As prescribed',
        'precautions': 'Follow medical advice'
    })

# Add basic routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/medicines')
def get_medicines():
    medicines = Medicine.query.all()
    return jsonify([{
        'id': m.id,
        'name': m.name,
        'generic_name': m.generic_name,
        'description': m.description,
        'category': m.category
    } for m in medicines])

@app.route('/api/symptom-check', methods=['POST'])
def symptom_check():
    data = request.get_json()
    symptoms = data.get('symptoms', '')
    age = data.get('age', 25)
    gender = data.get('gender', 'unknown')
    
    # Analyze symptoms
    predicted_diseases = analyze_symptoms(symptoms)
    
    # Save to database
    symptom_record = SymptomChecker(
        symptoms=json.dumps(symptoms.split(',')),
        predicted_diseases=json.dumps(predicted_diseases),
        confidence_score=0.75,  # Placeholder
        user_age=age,
        user_gender=gender
    )
    
    db.session.add(symptom_record)
    db.session.commit()
    
    return jsonify({
        'predicted_diseases': predicted_diseases,
        'recommendations': 'Please consult a healthcare professional for proper diagnosis'
    })

# Initialize database tables
def init_db():
    """Initialize database tables"""
    try:
        with app.app_context():
            db.create_all()
            # Add some sample data for in-memory database
            if not Medicine.query.first():
                sample_medicine = Medicine(
                    name="Paracetamol",
                    generic_name="Acetaminophen",
                    description="Pain reliever and fever reducer",
                    category="Analgesic",
                    manufacturer="Various",
                    severity_level="mild"
                )
                db.session.add(sample_medicine)
                db.session.commit()
    except Exception as e:
        print(f"Database initialization error: {e}")

# Initialize for local development
if not os.environ.get('VERCEL'):
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except:
        pass
    init_db()

# Initialize database tables for production
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database error: {e}")

# For local development
if __name__ == '__main__':
    try:
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    except:
        pass
    init_db()
    app.run(debug=True)
