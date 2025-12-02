const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY
    });
});

// Debug endpoint to list available models
app.get('/api/test-models', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.json({ error: 'No API key configured' });
        }

        // Try different model names
        const modelsToTest = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'gemini-2.0-flash-exp',
            'gemini-2.5-flash-exp',
            'gemini-3.0-flash-exp'
        ];

        const results = {};

        for (const model of modelsToTest) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${apiKey}`;
                const response = await fetch(url);
                results[model] = response.ok ? 'Available ✓' : `Error: ${response.status}`;
            } catch (error) {
                results[model] = `Error: ${error.message}`;
            }
        }

        res.json({
            message: 'Model availability test',
            models: results
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

// API endpoint for CV tailoring
app.post('/api/tailor-cv', async (req, res) => {
    try {
        const { cvText, jobDescription, provider } = req.body;

        // Validation
        if (!cvText || !jobDescription) {
            return res.status(400).json({
                error: 'Missing required fields: cvText and jobDescription'
            });
        }

        // Get API key
        const apiKey = provider === 'openai'
            ? process.env.OPENAI_API_KEY
            : process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: `API key not configured for ${provider}`
            });
        }

        // Call appropriate API
        let tailoredCV;
        if (provider === 'openai') {
            tailoredCV = await callOpenAI(cvText, jobDescription, apiKey);
        } else {
            tailoredCV = await callGemini(cvText, jobDescription, apiKey);
        }

        res.json({ tailoredCV });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate tailored CV'
        });
    }
});

// Gemini API call
async function callGemini(cvText, jobDescription, apiKey) {
    // Using gemini-2.5-flash (confirmed available in user's Google AI Studio)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are an expert CV/Resume writer and career coach. I need you to tailor my CV to match a specific job description.

MY CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Please provide:
1. A tailored version of my CV that highlights relevant experience and skills matching the job description
2. Rewrite bullet points to emphasize achievements that align with the job requirements
3. Use keywords from the job description naturally throughout the CV
4. Maintain the original structure and truthfulness of my experience
5. Make it ATS-friendly

Format the output as a complete, professional CV ready to use.`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();

    // Log response for debugging
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    // Handle different response formats
    if (data.candidates && data.candidates[0]) {
        if (data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
        } else if (data.candidates[0].text) {
            return data.candidates[0].text;
        }
    }

    // If we get here, the response format is unexpected
    throw new Error('Unexpected response format from Gemini API. Check server logs.');
}

// OpenAI API call
async function callOpenAI(cvText, jobDescription, apiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';

    const prompt = `You are an expert CV/Resume writer and career coach. I need you to tailor my CV to match a specific job description.

MY CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

Please provide:
1. A tailored version of my CV that highlights relevant experience and skills matching the job description
2. Rewrite bullet points to emphasize achievements that align with the job requirements
3. Use keywords from the job description naturally throughout the CV
4. Maintain the original structure and truthfulness of my experience
5. Make it ATS-friendly

Format the output as a complete, professional CV ready to use.`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 2048
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Export for Vercel
module.exports = app;

// Only listen if running locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🚀 CV Tailor Server Running!`);
        console.log(`📍 Local: http://localhost:${PORT}`);
        console.log(`✅ Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
        console.log(`✅ OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configured ✓' : 'Missing ✗'}\n`);
    });
}
