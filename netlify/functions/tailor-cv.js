const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { cvText, jobDescription, provider } = JSON.parse(event.body);

        // Validation
        if (!cvText || !jobDescription) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Call Gemini API
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const prompt = `You are an expert CV/Resume writer. Tailor the CV below to match the job description.

MY CV:
${cvText}

JOB DESCRIPTION:
${jobDescription}

CRITICAL INSTRUCTIONS:
1. Output ONLY the tailored CV content - NO introductions, NO explanations, NO commentary
2. Start directly with the candidate's name/header
3. Keep it to ONE PAGE maximum - be concise
4. Use keywords from the job description naturally
5. Highlight relevant experience and skills matching the job
6. Make it ATS-friendly
7. Maintain truthfulness - don't add fake experience
8. Format should be ready for immediate copy-paste or download

OUTPUT FORMAT: Pure CV text only, ready to use.`;

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
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: `Gemini API failed: ${response.status}` })
            };
        }

        const data = await response.json();

        // Log for debugging
        console.log('=== GEMINI RESPONSE ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('=======================');

        // Extract text - try multiple methods
        let tailoredCV = null;

        // Method 1: Standard structure
        if (data.candidates && data.candidates[0]) {
            const candidate = data.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
                tailoredCV = candidate.content.parts[0].text;
            } else if (candidate.text) {
                tailoredCV = candidate.text;
            }
        }

        // Method 2: Direct text field
        if (!tailoredCV && data.text) {
            tailoredCV = data.text;
        }

        if (!tailoredCV) {
            console.error('Could not extract text. Response keys:', Object.keys(data));
            if (data.candidates && data.candidates[0]) {
                console.error('First candidate keys:', Object.keys(data.candidates[0]));
            }
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Could not extract CV from API response',
                    debug: 'Check Netlify function logs for details'
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ tailoredCV })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
