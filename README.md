# Medicine Guide & Symptom Checker

A Flask-based web application for medicine information and symptom checking.

## Features

- **Symptom Checker**: Analyze symptoms and get possible disease predictions
- **Medicine Database**: Store and retrieve medicine information
- **Medical Consultations**: Track patient consultations and recommendations
- **Image Analysis**: Upload and analyze medical images (placeholder implementation)

## Local Development

### Prerequisites

- Python 3.9+
- Virtual environment (recommended)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd phani
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv medguide
   # Windows
   medguide\Scripts\activate
   # Linux/Mac
   source medguide/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize database:**
   ```bash
   python init_db.py
   ```

5. **Run the application:**
   ```bash
   python app.py
   ```

6. **Open in browser:**
   ```
   http://127.0.0.1:5000/
   ```

## Deployment on Vercel

### Prerequisites

- [Vercel account](https://vercel.com)
- [Vercel CLI](https://vercel.com/cli) (optional)

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Flask app
   - Click "Deploy"

### Method 2: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

### Environment Variables (Optional)

For production deployment, set these environment variables in Vercel:

- `SECRET_KEY`: A secure secret key for Flask sessions
- `DATABASE_URL`: Database connection string (if using external database)

## API Endpoints

### Symptom Checker
```http
POST /api/symptom-check
Content-Type: application/json

{
  "symptoms": "fever, headache, cough",
  "age": 30,
  "gender": "male"
}
```

### Get Medicines
```http
GET /api/medicines
```

## Testing

### Sample Symptoms to Test

1. **Common Cold**: `fever, headache, cough, runny nose, sore throat`
2. **Digestive Issues**: `nausea, stomach pain, vomiting, diarrhea`
3. **Respiratory**: `cough, shortness of breath, chest pain, wheezing`
4. **Headache**: `headache, sensitivity to light, nausea, dizziness`
5. **Allergies**: `rash, itching, swelling, runny nose, watery eyes`

## Project Structure

```
├── app.py              # Main Flask application
├── init_db.py          # Database initialization script
├── requirements.txt    # Python dependencies
├── vercel.json        # Vercel deployment configuration
├── .gitignore         # Git ignore file
├── templates/         # HTML templates
│   └── index.html     # Main page template
├── static/            # Static files (CSS, JS)
│   ├── styles.css     # Stylesheet
│   └── script.js      # JavaScript
└── uploads/           # File upload directory
```

## Technologies Used

- **Backend**: Flask, SQLAlchemy
- **Database**: SQLite (development), PostgreSQL (production recommended)
- **Frontend**: HTML, CSS, JavaScript
- **Deployment**: Vercel
- **Image Processing**: Pillow (PIL)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This application is for educational purposes only. Always consult with qualified healthcare professionals for medical advice and diagnosis.