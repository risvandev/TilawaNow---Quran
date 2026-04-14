import { Surah } from "./quran-api";

// Types
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface SearchResult {
    suggestedQuery?: string;
    matchedSurahs: number[];
    explanation?: string;
}

/**
 * Universal Streaming Chat calling backend API
 */
export const streamChatWithAI = async (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void
): Promise<void> => {
    try {
        const apiUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/api/chat";
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, stream: true }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "AI Service Unavailable");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Connection failed");

        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) onChunk(chunk);
        }
    } catch (error: any) {
        console.error("AI Stream Error:", error);
        throw error;
    }
};

/**
 * Single-shot Chat calling backend API
 */
export const chatWithAI = async (
    messages: ChatMessage[]
): Promise<string> => {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages, stream: false }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "AI Service Unavailable");
        }

        const data = await response.json();
        return data.content || "";
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

/**
 * Semantic Surah Search using AI
 */
export const searchWithAI = async (
    query: string,
    _history?: any,
    surahs: Surah[] = []
): Promise<SearchResult> => {
    const systemPrompt = `You are a Quranic semantic search assistant. 
Return ONLY a JSON object: { "matchedSurahs": [id1, id2...], "suggestedQuery": "clean version" }
Knowledge: ${surahs.slice(0, 50).map(s => `${s.id}:${s.name_simple}`).join(", ")}...`;

    try {
        const response = await chatWithAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Find surahs for: ${query}` }
        ]);

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {}
    
    return { matchedSurahs: [] };
};

/**
 * Utility to generate context-aware system prompts
 */
export function generateCompanionSystemPrompt(memory: any, basePrompt: string) {
    const contextSection = `
CURRENT USER CONTEXT:
- Level: ${memory.knowledgeLevel || 'Beginner'}
- Positions: ${memory.currentPosition?.verseKey || 'Overview'}

BREVITY PROTOCOL: 1-2 direct sentences only. Be extremely brief.

NAVIGATION:
- Help user reach: / (Landing Page), /home (App Home), /read, /dashboard, /settings, /about, /help, /contact
- Dynamic Routes: /info/surahId (for info), /story/surahId (for story)
- Command: [[NAVIGATE:/path]] (Always start with / and use LOWERCASE)
- Offer: [[OFFER_NAVIGATE:/path|Label]]
`;

    return basePrompt + contextSection;
}
