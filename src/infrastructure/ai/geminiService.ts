import { APIService } from '../http/api';

// Service for calling the Google Gemini (Generative AI) API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Base URL for Gemini REST API following quickstart
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
// Default model; you can override with VITE_GEMINI_MODEL in your .env
const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';

const geminiService = new APIService(BASE_URL, {
  'Content-Type': 'application/json'
});

// Expected structure for Gemini API response
interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text: string }[];
    };
  }[];
}

/**
 * Generate a question template by sending the base prompt to the Gemini API.
 */
export async function generateTemplate(prompt: string, modelOverride?: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Please set VITE_GEMINI_API_KEY in your environment.');
  }

  const targetModel = modelOverride || model;
  const endpoint = `/${targetModel}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
  };

  const response = await geminiService.fetch<GeminiResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response or valid content structure from Gemini API');
  }
  return text;
}
