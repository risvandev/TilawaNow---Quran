import { Surah } from "./quran-api";

// Types
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface SearchResult {
    suggestedQuery?: string;
    matchedSurahs: number[]; // IDs of matched surahs
    explanation?: string;
}

// Configuration
const DEFAULT_API_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";

// Generic Chat Function
export const chatWithAI = async (
    messages: ChatMessage[],
    apiKey: string,
    model: string = DEFAULT_MODEL
): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing");

    // Clean the key (remove whitespace/newlines which cause fetch errors)
    const cleanKey = apiKey.trim();

    // Allow custom endpoint from env (useful for OpenRouter, local models, etc.)
    const baseUrl = import.meta.env.VITE_AI_BASE_URL || DEFAULT_API_ENDPOINT;

    try {
        console.log("AI Service: Sending request...", {
            url: baseUrl,
            model,
            messageCount: messages.length,
            keyLength: cleanKey.length
        });

        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cleanKey}`, // Configurable: some providers use different headers, but Bearer is standard
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("AI Service Error Response:", response.status, errorData);

            if (response.status === 401) {
                throw new Error("Invalid API Key. Please check your .env file.");
            }
            if (response.status === 429) {
                throw new Error("Rate limit exceeded or insufficient quota.");
            }
            throw new Error(errorData.error?.message || `AI request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

// Specialized Search Function
export const searchWithAI = async (
    query: string,
    apiKey: string,
    availableSurahs: Surah[]
): Promise<SearchResult> => {
    if (!apiKey) throw new Error("API Key is missing");

    // Clean the key (remove whitespace/newlines)
    const cleanKey = apiKey.trim();

    // Allow custom endpoint from env
    const baseUrl = import.meta.env.VITE_AI_BASE_URL || DEFAULT_API_ENDPOINT;

    const systemPrompt = `
    You are a search assistant for a Quran application.
    The user is searching for a Surah using a query that might be a name, a topic, a meaning, or a misspelled word.
    
    Available Surahs (ID: Name - English Name):
    ${availableSurahs.map(s => `${s.id}: ${s.name_simple} - ${s.translated_name.name}`).join('\n')}
    
    Your goal:
    1. Identify which Surahs are most relevant to the query.
    2. If the user made a spelling mistake, suggest the correct query.
    3. If the query is a topic (e.g., "story of moses"), find the Surahs that discuss it most significantly.

    Return ONLY a JSON object with this format:
    {
      "suggestedQuery": "corrected query if needed, or null",
      "matchedSurahs": [list of relevant Surah IDs sorted by relevance],
      "explanation": "Brief reason for these matches (optional)"
    }
  `;

    try {
        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cleanKey}`,
                "HTTP-Referer": window.location.origin, // Required by OpenRouter
                "X-Title": "Tadabbur", // Optional for OpenRouter
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL, // OpenRouter model format usually requires provider prefix, or just gpt-3.5-turbo works too depending on default
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                temperature: 0.3,
                // Removed response_format: { type: "json_object" } for better compatibility
            }),
        });

        if (!response.ok) throw new Error("AI Search request failed");

        const data = await response.json();
        let content = data.choices[0].message.content;

        // robust JSON extraction
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        const result = JSON.parse(content);
        return result;
    } catch (error) {
        console.error("AI Search Error:", error);
        throw error; // Let the caller handle the fallback
    }
};
