// DOM Elements
const cvInput = document.getElementById('cvInput');
const jobDescInput = document.getElementById('jobDescInput');
const apiProvider = document.getElementById('apiProvider');
const tailorBtn = document.getElementById('tailorBtn');
const outputSection = document.getElementById('outputSection');
const tailoredOutput = document.getElementById('tailoredOutput');
const copyBtn = document.getElementById('copyBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const cvCharCount = document.getElementById('cvCharCount');
const jobCharCount = document.getElementById('jobCharCount');
const scoreText = document.getElementById('scoreText');
const scoreFill = document.getElementById('scoreFill');
const keywordsList = document.getElementById('keywordsList');
const toast = document.getElementById('toast');

// API Configuration
const API_BASE_URL = '/.netlify/functions';  // Point to Netlify functions

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupLanguageSelector();
    checkServerHealth();
});

function setupEventListeners() {
    // Character counters
    cvInput.addEventListener('input', () => updateCharCount(cvInput, cvCharCount));
    jobDescInput.addEventListener('input', () => updateCharCount(jobDescInput, jobCharCount));

    // Main action button
    tailorBtn.addEventListener('click', tailorCV);

    // Output actions
    copyBtn.addEventListener('click', copyToClipboard);
    downloadPdfBtn.addEventListener('click', downloadPDF);
}

function setupLanguageSelector() {
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!languageBtn || !languageDropdown) return;

    // Toggle dropdown
    languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        languageDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        languageDropdown.classList.remove('show');
    });

    // Language selection
    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = option.dataset.lang;
            setLanguage(lang);
            languageDropdown.classList.remove('show');

            // Update active state
            langOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });

        // Set initial active state
        if (option.dataset.lang === currentLanguage) {
            option.classList.add('active');
        }
    });
}

async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/tailor-cv`, { method: 'OPTIONS' }); // Simple health check
        const data = await response.json();
        console.log('✅ Server healthy:', data);
    } catch (error) {
        console.warn('⚠️ Server check failed - make sure server is running');
    }
}

async function tailorCV() {
    // Validation
    if (!cvInput.value.trim()) {
        showToast(t('toastEnterCV'), 'error');
        return;
    }

    if (!jobDescInput.value.trim()) {
        showToast(t('toastEnterJob'), 'error');
        return;
    }

    // UI updates
    tailorBtn.disabled = true;
    tailorBtn.classList.add('loading');
    outputSection.style.display = 'none';

    try {
        const provider = apiProvider.value;

        // Call backend API
        const response = await fetch(`${API_BASE_URL}/tailor-cv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cvText: cvInput.value,
                jobDescription: jobDescInput.value,
                provider: provider
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            let errorMessage = 'Failed to generate tailored CV';
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
            } catch (e) {
                errorMessage += `: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        displayResults(data.tailoredCV);
        showToast(t('toastSuccess'), 'success');

    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        tailorBtn.disabled = false;
        tailorBtn.classList.remove('loading');
    }
}

function displayResults(tailoredCV) {
    // Display tailored CV
    tailoredOutput.textContent = tailoredCV;

    // Calculate and display keyword match score
    const { score, keywords } = calculateKeywordMatch(tailoredCV, jobDescInput.value);
    displayScore(score);
    displayKeywords(keywords);

    // Show output section
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Show support section
    const supportSection = document.getElementById('supportSection');
    if (supportSection) supportSection.style.display = 'block';
}

function calculateKeywordMatch(cv, jobDesc) {
    // Extract important keywords from job description
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);

    const extractKeywords = (text) => {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
    };

    const jobKeywords = extractKeywords(jobDesc);
    const cvKeywords = extractKeywords(cv);

    // Count keyword frequency
    const keywordFreq = {};
    jobKeywords.forEach(word => {
        keywordFreq[word] = (keywordFreq[word] || 0) + 1;
    });

    // Find top keywords
    const sortedKeywords = Object.entries(keywordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([word]) => word);

    // Check which keywords are in CV
    const cvKeywordSet = new Set(cvKeywords);
    const matchedKeywords = sortedKeywords.filter(word => cvKeywordSet.has(word));

    // Calculate score
    const score = Math.round((matchedKeywords.length / sortedKeywords.length) * 100);

    return {
        score,
        keywords: matchedKeywords.slice(0, 15)
    };
}

function displayScore(score) {
    scoreText.textContent = `${score}%`;

    // Animate score circle
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (score / 100) * circumference;

    setTimeout(() => {
        scoreFill.style.strokeDashoffset = offset;
    }, 100);
}

function displayKeywords(keywords) {
    keywordsList.innerHTML = '';
    keywords.forEach((keyword, index) => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        tag.style.animationDelay = `${index * 0.05}s`;
        keywordsList.appendChild(tag);
    });
}

async function copyToClipboard() {
    try {
        await navigator.clipboard.writeText(tailoredOutput.textContent);
        showToast(t('toastCopied'), 'success');
    } catch (error) {
        showToast(t('toastCopyFailed'), 'error');
    }
}

function downloadPDF() {
    const element = document.getElementById('tailoredOutput');
    const opt = {
        margin: 1,
        filename: 'tailored-cv.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Use html2pdf to handle Arabic/RTL correctly
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => {
            showToast(t('toastPDFSuccess'), 'success');
        }).catch(err => {
            console.error(err);
            showToast(t('toastPDFFailed'), 'error');
        });
    } else {
        console.error('html2pdf library not loaded');
        showToast(t('toastPDFFailed'), 'error');
    }
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
