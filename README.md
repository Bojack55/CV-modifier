
# Generative CV Tailor

> A production-grade AI agent that autonomously restructures resumes to align with specific job descriptions, significantly improving ATS compatibility. It utilizes advanced prompt engineering pipelines to transform unstructured candidate data into targeted, professional profiles.

### Features
*   **GenAI Integration:** Direct utilization of Google Gemini 1.5 Pro LLM SDK.
*   **Context-Aware Rewriting:** Custom prompt engineering to mimic professional recruiter standards.
*   **Structured Output:** Parsing of unstructured text into clean, render-ready JSON.
*   **Real-time Streaming:** Responsive frontend interface for immediate feedback.

### Tech Stack
*   Node.js
*   Express
*   Google Gemini SDK

### Run Instructions
```bash
npm install
# Ensure .env contains your API_KEY
node server.js
```
