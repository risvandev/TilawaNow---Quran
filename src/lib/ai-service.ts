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

// Helper to execute request with fallback
const executeWithFallback = async (
    requestFn: (key: string) => Promise<any>
): Promise<any> => {
    const primaryKey = import.meta.env.VITE_AI_API_KEY;
    const secondaryKey = import.meta.env.VITE_AI_API_KEY_SECONDARY;

    if (!primaryKey && !secondaryKey) {
        throw new Error("No AI API Keys configured. Please check .env file.");
    }

    // Try Primary
    try {
        if (primaryKey) {
            return await requestFn(primaryKey);
        }
    } catch (error: any) {
        console.warn("Primary AI Key failed:", error.message);
        // If no secondary key, rethrow
        if (!secondaryKey) throw error;
    }

    // Try Secondary
    if (secondaryKey) {
        console.log("Switching to Secondary AI Key...");
        try {
            return await requestFn(secondaryKey);
        } catch (error: any) {
            console.error("Secondary AI Key also failed:", error.message);
            throw new Error("AI Service unavailable: Both keys failed.");
        }
    }
};

// Generic Chat Function
export const chatWithAI = async (
    messages: ChatMessage[],
    apiKey?: string, // Optional now
    model: string = DEFAULT_MODEL
): Promise<string> => {
    
    // Core request logic
    const makeRequest = async (key: string) => {
        const cleanKey = key.trim();
        const baseUrl = import.meta.env.VITE_AI_BASE_URL || DEFAULT_API_ENDPOINT;

        console.log("AI Service: Sending request...", {
            url: baseUrl,
            model,
            messageCount: messages.length
        });

        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cleanKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 401) throw new Error("Invalid API Key");
            if (response.status === 429) throw new Error("Rate limit exceeded");
            
            throw new Error(errorData.error?.message || `AI request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    };

    // If explicit key provided, use it directly (legacy support or specific overrides)
    if (apiKey) {
        return makeRequest(apiKey);
    }

    // Otherwise use fallback logic
    return executeWithFallback(makeRequest);
};

// Specialized Search Function
export const searchWithAI = async (
    query: string,
    apiKey?: string, // Optional
    availableSurahs: Surah[] = [] // Default empty array to be safe
): Promise<SearchResult> => {
    
    const makeRequest = async (key: string) => {
        const cleanKey = key.trim();
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

        const response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cleanKey}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "TilawaNow",
            },
            body: JSON.stringify({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                temperature: 0.3,
            }),
        });

        if (!response.ok) throw new Error("AI Search request failed");

        const data = await response.json();
        let content = data.choices[0].message.content;

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        return JSON.parse(content);
    };

    if (apiKey) {
        return makeRequest(apiKey);
    }

    return executeWithFallback(makeRequest);
};
