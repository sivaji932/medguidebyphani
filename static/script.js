// Global Variables
let currentSession = null;
let followUpQuestions = [];
let currentImageData = null;

// API Base URL - Change this to your backend URL
const API_BASE_URL = 'https://your-backend.onrender.com/api';

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupMobileMenu();
    loadMedicineCategories();
    setupEventListeners();
    populateMedicineSelect();
}

// Navigation Functions
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu if open
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Enter key support for symptom description
    const symptomTextarea = document.getElementById('symptom-description');
    if (symptomTextarea) {
        symptomTextarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                analyzeSymptoms();
            }
        });
    }
    
    // Medicine search with debouncing
    const medicineSearch = document.getElementById('medicine-search');
    if (medicineSearch) {
        let searchTimeout;
        medicineSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchMedicines, 300);
        });
    }
}

// Symptom Analysis Functions
async function analyzeSymptoms() {
    const symptomText = document.getElementById('symptom-description').value.trim();
    
    if (!symptomText) {
        showAlert('Please describe your symptoms first.', 'warning');
        return;
    }
    
    showLoading('Analyzing your symptoms...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/symptom-checker`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symptoms: symptomText,
                session_id: generateSessionId()
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        currentSession = result.session_id;
        
        displaySymptomResults(result.analysis);
        
        if (result.next_step === 'follow_up_questions') {
            showFollowUpQuestions(result.analysis.follow_up_questions);
        } else {
            // Get medicine recommendations directly
            if (result.analysis.possible_diseases && result.analysis.possible_diseases.length > 0) {
                getMedicineRecommendations(result.analysis.possible_diseases[0]);
            }
        }
        
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        showAlert('Failed to analyze symptoms. Make sure the backend server is running.', 'error');
    } finally {
        hideLoading();
    }
}

function displaySymptomResults(analysis) {
    const resultsSection = document.getElementById('symptom-results');
    const conditionsList = document.getElementById('conditions-list');
    const confidenceFill = document.getElementById('confidence-fill');
    const confidenceText = document.getElementById('confidence-text');
    
    if (!resultsSection || !conditionsList || !confidenceFill || !confidenceText) {
        console.error('Missing required elements for displaying results');
        return;
    }
    
    // Show results section
    resultsSection.classList.remove('hidden');
    
    // Update confidence meter
    const confidence = Math.min((analysis.confidence || 0) * 100, 100);
    confidenceFill.style.width = `${confidence}%`;
    confidenceText.textContent = `${Math.round(confidence)}%`;
    
    // Display possible conditions
    conditionsList.innerHTML = '';
    if (analysis.possible_diseases && analysis.possible_diseases.length > 0) {
        analysis.possible_diseases.forEach((disease, index) => {
            const probability = Math.max(90 - (index * 15), 30);
            const conditionCard = createConditionCard(disease, probability);
            conditionsList.appendChild(conditionCard);
        });
    } else {
        conditionsList.innerHTML = '<p>No specific conditions identified. Please provide more details.</p>';
    }
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createConditionCard(disease, probability) {
    const card = document.createElement('div');
    card.className = 'condition-card';
    card.innerHTML = `
        <div class="condition-name">${formatDiseaseName(disease)}</div>
        <div class="condition-probability">Probability: ${probability}%</div>
    `;
    return card;
}

function formatDiseaseName(disease) {
    return disease.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function showFollowUpQuestions(questions) {
    const followUpSection = document.getElementById('follow-up-section');
    const questionsContainer = document.getElementById('questions-container');
    
    if (!followUpSection || !questionsContainer) {
        console.error('Missing follow-up elements');
        return;
    }
    
    followUpQuestions = questions || [];
    questionsContainer.innerHTML = '';
    
    followUpQuestions.forEach((question, index) => {
        const questionItem = createQuestionItem(question, index);
        questionsContainer.appendChild(questionItem);
    });
    
    followUpSection.classList.remove('hidden');
}

function createQuestionItem(question, index) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <label for="question-${index}">${question}</label>
        <input type="text" id="question-${index}" name="question-${index}" 
               placeholder="Your answer..." required>
    `;
    return questionDiv;
}

async function submitFollowUp() {
    const answers = {};
    followUpQuestions.forEach((question, index) => {
        const input = document.getElementById(`question-${index}`);
        if (input && input.value.trim()) {
            answers[question] = input.value.trim();
        }
    });
    
    if (Object.keys(answers).length === 0) {
        showAlert('Please answer at least one question.', 'warning');
        return;
    }
    
    showLoading('Processing your answers...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/follow-up-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                session_id: currentSession,
                answers: answers,
                age: 25,
                weight: 70
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to process answers');
        }
        
        const result = await response.json();
        displayMedicineRecommendations(result.medicine_recommendations);
        
    } catch (error) {
        console.error('Error processing follow-up:', error);
        showAlert('Failed to process your answers. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Image Upload and Analysis
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAlert('Please select a valid image file.', 'warning');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showAlert('Image size should be less than 5MB.', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = e.target.result;
        showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(imageSrc) {
    const previewContainer = document.getElementById('image-preview');
    const analyzeBtn = document.getElementById('analyze-image-btn');
    
    if (previewContainer && analyzeBtn) {
        previewContainer.innerHTML = `<img src="${imageSrc}" alt="Uploaded image" style="max-width: 200px; max-height: 200px; border-radius: 8px;">`;
        previewContainer.classList.remove('hidden');
        analyzeBtn.classList.remove('hidden');
    }
}

async function analyzeImage() {
    if (!currentImageData) {
        showAlert('Please upload an image first.', 'warning');
        return;
    }
    
    showLoading('Analyzing uploaded image...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/image-diagnosis`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: currentImageData,
                session_id: generateSessionId()
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to analyze image');
        }
        
        const result = await response.json();
        
        if (result.status === 'needs_clarification') {
            showFollowUpQuestions(result.questions);
        } else {
            showAlert('Image analysis complete. Please describe symptoms for better results.', 'info');
        }
        
    } catch (error) {
        console.error('Error analyzing image:', error);
        showAlert('Failed to analyze image. Please try describing your symptoms instead.', 'error');
    } finally {
        hideLoading();
    }
}

// Medicine Search Functions
async function searchMedicines() {
    const searchQuery = document.getElementById('medicine-search').value.trim();
    const category = document.getElementById('category-filter').value;
    
    if (!searchQuery && !category) {
        document.getElementById('medicine-results').innerHTML = '';
        return;
    }
    
    try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('q', searchQuery);
        if (category) params.append('category', category);
        
        const response = await fetch(`${API_BASE_URL}/medicines/search?${params}`);
        
        if (!response.ok) {
            throw new Error('Failed to search medicines');
        }
        
        const medicines = await response.json();
        displayMedicineResults(medicines);
        
    } catch (error) {
        console.error('Error searching medicines:', error);
        showAlert('Failed to search medicines. Check backend connection.', 'error');
    }
}

function displayMedicineResults(medicines) {
    const resultsContainer = document.getElementById('medicine-results');
    
    if (!resultsContainer) return;
    
    if (medicines.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center">No medicines found. Try a different search term.</p>';
        return;
    }
    
    resultsContainer.innerHTML = '';
    medicines.forEach(medicine => {
        const medicineCard = createMedicineCard(medicine);
        resultsContainer.appendChild(medicineCard);
    });
}

function createMedicineCard(medicine) {
    const card = document.createElement('div');
    card.className = 'medicine-card';
    card.onclick = () => showMedicineDetails(medicine.id);
    
    card.innerHTML = `
        <div class="medicine-card-header">
            <div>
                <h3>${medicine.name}</h3>
                <p class="medicine-generic">${medicine.generic_name}</p>
            </div>
            <span class="medicine-category">${medicine.category || 'Medicine'}</span>
        </div>
        <p class="medicine-description">${medicine.description}</p>
        <p class="medicine-manufacturer">Manufacturer: ${medicine.manufacturer || 'Various'}</p>
    `;
    
    return card;
}

async function showMedicineDetails(medicineId) {
    showLoading('Loading medicine details...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/medicine/${medicineId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load medicine details');
        }
        
        const medicine = await response.json();
        displayMedicineModal(medicine);
        
    } catch (error) {
        console.error('Error loading medicine details:', error);
        showAlert('Failed to load medicine details.', 'error');
    } finally {
        hideLoading();
    }
}

function displayMedicineModal(medicine) {
    const modal = document.getElementById('medicine-modal');
    const detailsContainer = document.getElementById('medicine-details');
    
    if (!modal || !detailsContainer) return;
    
    detailsContainer.innerHTML = `
        <h2>${medicine.name}</h2>
        <p><strong>Generic Name:</strong> ${medicine.generic_name}</p>
        <p><strong>Category:</strong> ${medicine.category}</p>
        
        <h3>Description</h3>
        <p>${medicine.description}</p>
        
        <h3>Indications</h3>
        <p>${medicine.indications || 'Not specified'}</p>
        
        <h3>Side Effects</h3>
        <p>${medicine.side_effects || 'Consult healthcare provider'}</p>
        
        <h3>Precautions</h3>
        <p>${medicine.precautions || 'Follow doctor\'s instructions'}</p>
        
        <h3>Contraindications</h3>
        <p>${medicine.contraindications || 'None specified'}</p>
    `;
    
    modal.classList.remove('hidden');
}

function closeMedicineModal() {
    const modal = document.getElementById('medicine-modal');
    if (modal) modal.classList.add('hidden');
}

// Dosage Calculator Functions
async function calculateDosage() {
    const age = parseInt(document.getElementById('patient-age').value);
    const weight = parseFloat(document.getElementById('patient-weight').value);
    const medicineId = document.getElementById('medicine-select').value;
    const condition = document.getElementById('medical-condition').value;
    
    if (!age || !weight || !medicineId) {
        showAlert('Please fill in age, weight, and select a medicine.', 'warning');
        return;
    }
    
    if (age < 1 || age > 120) {
        showAlert('Please enter a valid age (1-120 years).', 'warning');
        return;
    }
    
    if (weight < 1 || weight > 300) {
        showAlert('Please enter a valid weight (1-300 kg).', 'warning');
        return;
    }
    
    showLoading('Calculating dosage...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/dosage-calculator`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                medicine_id: parseInt(medicineId),
                age: age,
                weight: weight,
                condition: condition
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to calculate dosage');
        }
        
        const result = await response.json();
        displayDosageResults(result);
        
    } catch (error) {
        console.error('Error calculating dosage:', error);
        showAlert('Failed to calculate dosage. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function displayDosageResults(result) {
    const resultsContainer = document.getElementById('dosage-results');
    
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="dosage-card">
            <h3>${result.medicine_name}</h3>
            <div class="dosage-info">
                <div class="dosage-item">
                    <span class="label">Recommended Dose:</span>
                    <span class="value">${result.calculated_dosage}</span>
                </div>
                <div class="dosage-item">
                    <span class="label">Instructions:</span>
                    <span class="value">${result.instructions}</span>
                </div>
            </div>
            <div class="dosage-warnings">
                <h4><i class="fas fa-info-circle"></i> Important Note</h4>
                <p>Always consult with a healthcare professional before taking any medication.</p>
                ${result.warnings && result.warnings.length > 0 ? 
                    `<h4><i class="fas fa-exclamation-triangle"></i> Warnings</h4>
                     <ul>${result.warnings.map(w => `<li>${w}</li>`).join('')}</ul>` : ''
                }
            </div>
        </div>
    `;
    
    resultsContainer.classList.remove('hidden');
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Medicine Recommendations
function displayMedicineRecommendations(recommendations) {
    const recommendationsSection = document.getElementById('recommendations-section');
    const medicineList = document.getElementById('medicine-list');
    
    if (!recommendationsSection || !medicineList) return;
    
    medicineList.innerHTML = '';
    
    if (recommendations && recommendations.length > 0) {
        recommendations.forEach(medicine => {
            const medicineCard = createMedicineRecommendationCard(medicine);
            medicineList.appendChild(medicineCard);
        });
        
        recommendationsSection.classList.remove('hidden');
    } else {
        showAlert('No specific medicine recommendations available. Please consult a healthcare professional.', 'info');
    }
}

function createMedicineRecommendationCard(medicine) {
    const card = document.createElement('div');
    card.className = 'medicine-recommendation';
    
    card.innerHTML = `
        <div class="medicine-name">${medicine.name}</div>
        <div class="medicine-dosage">Dosage: ${medicine.dosage}</div>
        <div class="medicine-duration">Duration: ${medicine.duration}</div>
        ${medicine.note ? `<div class="medicine-note"><small>${medicine.note}</small></div>` : ''}
    `;
    
    return card;
}

// Medical Research Functions
async function searchMedicalInfo() {
    const symptomText = document.getElementById('symptom-description').value.trim();
    
    if (!symptomText) {
        showAlert('Please describe your symptoms first to search for medical information.', 'warning');
        return;
    }
    
    showLoading('Searching medical databases...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/medical-research`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: symptomText
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to search medical information');
        }
        
        const result = await response.json();
        displayResearchResults(result.research_results);
        
    } catch (error) {
        console.error('Error searching medical info:', error);
        showAlert('Failed to search medical information. Please try again later.', 'error');
    } finally {
        hideLoading();
    }
}

function displayResearchResults(results) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-search"></i> Medical Research Results</h2>
            <div class="research-content">
                <h3>Online Resources:</h3>
                ${results.sources.map(source => `
                    <div class="research-source">
                        <h4><a href="${source.url}" target="_blank">${source.title}</a></h4>
                        <p>${source.summary}</p>
                    </div>
                `).join('')}
                
                <h3>General Recommendations:</h3>
                <ul>
                    ${results.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
                
                <div class="research-disclaimer">
                    <strong>Disclaimer:</strong> This information is for educational purposes only. 
                    Always consult with a healthcare professional for medical advice.
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Helper Functions
async function getMedicineRecommendations(disease) {
    // Mock implementation - get recommendations for the first disease
    const mockRecommendations = [
        { name: 'Paracetamol', dosage: '500mg every 6 hours', duration: '3-5 days' },
        { name: 'Ibuprofen', dosage: '400mg every 8 hours', duration: '3-5 days' }
    ];
    displayMedicineRecommendations(mockRecommendations);
}

function populateMedicineSelect() {
    const select = document.getElementById('medicine-select');
    if (select) {
        const medicines = [
            { id: 1, name: 'Paracetamol' },
            { id: 2, name: 'Ibuprofen' },
            { id: 3, name: 'Amoxicillin' }
        ];
        
        medicines.forEach(med => {
            const option = document.createElement('option');
            option.value = med.id;
            option.textContent = med.name;
            select.appendChild(option);
        });
    }
}

// Utility Functions
function generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        const loadingText = loadingOverlay.querySelector('p');
        if (loadingText) loadingText.textContent = message;
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function showAlert(message, type = 'info') {
    const colors = {
        info: '#2563eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${colors[type] || colors.info};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    alert.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" 
                style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

async function loadMedicineCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
            const categories = await response.json();
            const categorySelect = document.getElementById('category-filter');
            
            if (categorySelect) {
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Emergency Functions
function callEmergency() {
    showAlert('Please call your local emergency number immediately!', 'error');
    if (navigator.userAgent.match(/Mobile/)) {
        window.location.href = 'tel:911';
    } else {
        window.open('tel:911', '_blank');
    }
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergency-modal');
    if (modal) modal.classList.add('hidden');
}

// Add styles for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .research-source {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
    }
    
    .research-source h4 {
        margin-bottom: 0.5rem;
    }
    
    .research-source a {
        color: #2563eb;
        text-decoration: none;
    }
    
    .research-source a:hover {
        text-decoration: underline;
    }
    
    .research-disclaimer {
        background: #fef3c7;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
        border-left: 4px solid #f59e0b;
    }
    
    .condition-card {
        background: #f1f5f9;
        padding: 1rem;
        border-radius: 8px;
        border-left: 4px solid #2563eb;
        margin-bottom: 0.5rem;
    }
    
    .condition-name {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }
    
    .condition-probability {
        font-size: 0.875rem;
        color: #64748b;
    }
    
    .question-item {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .question-item label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #374151;
    }
    
    .question-item input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-family: inherit;
    }
    
    .medicine-recommendation {
        background: linear-gradient(135deg, #2563eb, #10b981);
        color: white;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .medicine-name {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    
    .dosage-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .dosage-info {
        margin: 1.5rem 0;
    }
    
    .dosage-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        margin-bottom: 0.5rem;
    }
    
    .dosage-item .label {
        font-weight: 600;
        color: #374151;
    }
    
    .dosage-item .value {
        color: #2563eb;
        font-weight: 600;
    }
    
    .dosage-warnings {
        background: linear-gradient(135deg, #f59e0b, #f97316);
        color: white;
        padding: 1rem;
        border-radius: 8px;
    }
`;
document.head.appendChild(style);
