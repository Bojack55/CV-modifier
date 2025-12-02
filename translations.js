// Translation system for CV Tailor
const translations = {
    en: {
        // Header
        title: "CV Tailor",
        tagline: "AI-Powered Resume Optimization",

        // Input Section
        yourCV: "Your CV",
        jobDescription: "Job Description",
        step1: "Step 1",
        step2: "Step 2",
        cvPlaceholder: "Paste your CV content here...\n\nInclude your experience, skills, education, and achievements.",
        jobPlaceholder: "Paste the job description here...\n\nInclude required skills, qualifications, and responsibilities.",
        characters: "characters",

        // API Config
        aiProvider: "AI Provider",
        selectModel: "Select AI Model",
        gemini: "Google Gemini (Recommended)",
        openai: "OpenAI GPT",

        // Action Button
        tailorButton: "Tailor My CV",

        // Output Section
        tailoredCV: "Tailored CV",
        keywordScore: "Keyword Match Score",
        matchedKeywords: "Matched Keywords",

        // Toast Messages
        toastEnterCV: "Please enter your CV",
        toastEnterJob: "Please enter job description",
        toastSuccess: "CV tailored successfully!",
        toastCopied: "Copied to clipboard!",
        toastCopyFailed: "Failed to copy",
        toastPDFSuccess: "PDF downloaded successfully!",
        toastPDFFailed: "Failed to generate PDF",

        // Footer
        footer: "Powered by AI • Your data is processed securely and never stored",

        // Language
        currentLang: "English"
    },
    ar: {
        // Header
        title: "مُصمم السيرة الذاتية",
        tagline: "تحسين السيرة الذاتية بالذكاء الاصطناعي",

        // Input Section
        yourCV: "سيرتك الذاتية",
        jobDescription: "وصف الوظيفة",
        step1: "الخطوة 1",
        step2: "الخطوة 2",
        cvPlaceholder: "الصق محتوى سيرتك الذاتية هنا...\n\nقم بتضمين خبرتك ومهاراتك وتعليمك وإنجازاتك.",
        jobPlaceholder: "الصق وصف الوظيفة هنا...\n\nقم بتضمين المهارات والمؤهلات والمسؤوليات المطلوبة.",
        characters: "حرف",

        // API Config
        aiProvider: "مزود الذكاء الاصطناعي",
        selectModel: "اختر نموذج الذكاء الاصطناعي",
        gemini: "Google Gemini (موصى به)",
        openai: "OpenAI GPT",

        // Action Button
        tailorButton: "صمم سيرتي الذاتية",

        // Output Section
        tailoredCV: "السيرة الذاتية المصممة",
        keywordScore: "درجة تطابق الكلمات المفتاحية",
        matchedKeywords: "الكلمات المفتاحية المطابقة",

        // Toast Messages
        toastEnterCV: "الرجاء إدخال سيرتك الذاتية",
        toastEnterJob: "الرجاء إدخال وصف الوظيفة",
        toastSuccess: "تم تصميم السيرة الذاتية بنجاح!",
        toastCopied: "تم النسخ إلى الحافظة!",
        toastCopyFailed: "فشل النسخ",
        toastPDFSuccess: "تم تنزيل ملف PDF بنجاح!",
        toastPDFFailed: "فشل إنشاء ملف PDF",

        // Footer
        footer: "مدعوم بالذكاء الاصطناعي • يتم معالجة بياناتك بشكل آمن ولا يتم تخزينها",

        // Language
        currentLang: "العربية"
    }
};

// Current language
let currentLanguage = localStorage.getItem('cvTailor_language') || 'en';

// Translation function
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Set language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('cvTailor_language', lang);
    updatePageLanguage();

    // Update HTML direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
}

// Update all page text
function updatePageLanguage() {
    // Update current language display
    const currentLangSpan = document.getElementById('currentLanguage');
    if (currentLangSpan) currentLangSpan.textContent = t('currentLang');

    // Update header
    const title = document.querySelector('.logo h1');
    if (title) title.textContent = t('title');

    const tagline = document.querySelector('.tagline');
    if (tagline) tagline.textContent = t('tagline');

    // Update input cards
    const cvHeader = document.querySelector('.input-card:nth-child(1) h2');
    if (cvHeader) cvHeader.textContent = t('yourCV');

    const jobHeader = document.querySelector('.input-card:nth-child(2) h2');
    if (jobHeader) jobHeader.textContent = t('jobDescription');

    const step1 = document.querySelector('.input-card:nth-child(1) .badge');
    if (step1) step1.textContent = t('step1');

    const step2 = document.querySelector('.input-card:nth-child(2) .badge');
    if (step2) step2.textContent = t('step2');

    // Update placeholders
    const cvInput = document.getElementById('cvInput');
    if (cvInput) cvInput.placeholder = t('cvPlaceholder');

    const jobInput = document.getElementById('jobDescInput');
    if (jobInput) jobInput.placeholder = t('jobPlaceholder');

    // Update API config
    const configHeader = document.querySelector('.config-card h2');
    if (configHeader) configHeader.textContent = t('aiProvider');

    const selectLabel = document.querySelector('.input-group label');
    if (selectLabel) selectLabel.textContent = t('selectModel');

    // Update button
    const tailorBtn = document.querySelector('#tailorBtn .button-content');
    if (tailorBtn) {
        const icon = tailorBtn.querySelector('svg');
        tailorBtn.innerHTML = '';
        tailorBtn.appendChild(icon);
        tailorBtn.appendChild(document.createTextNode(' ' + t('tailorButton')));
    }

    // Update output section
    const outputHeader = document.querySelector('.output-card h2');
    if (outputHeader) outputHeader.textContent = t('tailoredCV');

    const scoreHeader = document.querySelector('.stats-card h2');
    if (scoreHeader) scoreHeader.textContent = t('keywordScore');

    const keywordsHeader = document.querySelector('.keywords-section h3');
    if (keywordsHeader) keywordsHeader.textContent = t('matchedKeywords');

    // Update footer
    const footer = document.querySelector('.footer p');
    if (footer) footer.textContent = t('footer');

    // Update character counts
    updateCharCount(cvInput, document.getElementById('cvCharCount'));
    updateCharCount(jobInput, document.getElementById('jobCharCount'));
}

// Helper for character count
function updateCharCount(input, counter) {
    if (!input || !counter) return;
    const count = input.value.length;
    counter.textContent = `${count.toLocaleString()} ${t('characters')}`;
}

// Initialize language on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setLanguage(currentLanguage);
    });
}
