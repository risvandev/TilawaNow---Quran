import getPuter from "./puter-service";
import { Surah, fetchTafsir, fetchSingleVerse, TAFSIR_RESOURCES } from "./quran-api";

// Types
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export type AIChatMode = 'Quick' | 'Detailed' | 'Research';

export interface GroundingContext {
    verseKey?: string;
    surahId?: number;
    mode: AIChatMode;
}

/**
 * Universal Streaming Chat calling Puter.js
 */
export const streamChatWithAI = async (
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options: GroundingContext = { mode: 'Quick' }
): Promise<void> => {
    if (typeof window === "undefined") return;

    try {
        const puter = getPuter();
        if (!puter) throw new Error("Puter.js SDK not initialized");

        // Dynamic Configuration based on mode
        const isAdvanced = options.mode !== 'Quick';
        const model = isAdvanced ? 'gpt-4o' : 'gpt-4o-mini';
        const tools = options.mode === 'Research' ? [{ type: "web_search" }] : [];

        // Prepare Grounding if verseKey is provided
        let enhancedMessages = [...messages];
        if (options.verseKey) {
            const groundingData = await prepareGroundingContext(options.verseKey);
            if (groundingData) {
                enhancedMessages = [
                    { role: "system", content: groundingData },
                    ...messages
                ];
            }
        }

        const responseStream = (await puter.ai.chat(enhancedMessages, { 
            model,
            stream: true,
            tools
        })) as any;

        for await (const part of responseStream) {
            if (part?.text) {
                onChunk(part.text);
            }
        }
    } catch (error: any) {
        console.error("AI Stream Error:", error);
        onChunk("\n\n[Connection interrupted. Please try again.]");
        throw error;
    }
};

/**
 * Single-shot Chat calling Puter.js
 */
export const chatWithAI = async (
    messages: ChatMessage[],
    options: GroundingContext = { mode: 'Quick' }
): Promise<string> => {
    if (typeof window === "undefined") return "";

    try {
        const puter = getPuter();
        if (!puter) throw new Error("Puter.js SDK not initialized");

        const isAdvanced = options.mode !== 'Quick';
        const model = isAdvanced ? 'gpt-4o' : 'gpt-4o-mini';
        const tools = options.mode === 'Research' ? [{ type: "web_search" }] : [];

        // Prepare Grounding
        let enhancedMessages = [...messages];
        if (options.verseKey) {
            const groundingData = await prepareGroundingContext(options.verseKey);
            if (groundingData) {
                enhancedMessages = [
                    { role: "system", content: groundingData },
                    ...messages
                ];
            }
        }

        const response = (await puter.ai.chat(enhancedMessages, {
            model,
            stream: false,
            tools
        })) as any;
        return response?.message?.content || response?.text || "";
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

/**
 * Fetches verified Quran text and classical Tafsir to ground the AI
 */
async function prepareGroundingContext(verseKey: string): Promise<string | null> {
    try {
        const [verse, tafsir] = await Promise.all([
            fetchSingleVerse(verseKey),
            fetchTafsir(verseKey, TAFSIR_RESOURCES.IBN_KATHIR_EN)
        ]);

        if (!verse) return null;

        return `
GROUNDING DATA (Source Truth):
- Verse: ${verseKey}
- Arabic: ${verse.text_uthmani}
- Translation: ${verse.translations?.[0]?.text || 'N/A'}
- Tafsir Snippet (Ibn Kathir): ${tafsir?.text || 'Standard interpretation requested.'}

INSTRUCTIONS:
1. Treat the GROUNDING DATA as the primary authority.
2. Summarize and simplify the classical Tafsir; DO NOT invent your own interpretations.
3. Structure your response using markdown: 
   ### 📖 Background
   ### 💡 Key Lessons
   ### 🏛️ Scholarly Insight (Summation)
4. Be academic, respectful, and objective.
`;
    } catch (e) {
        return null;
    }
}

/**
 * Utility to generate context-aware system prompts
 */
export function generateCompanionSystemPrompt(memory: any, basePrompt: string) {
    const contextSection = `
CURRENT USER CONTEXT:
- Level: ${memory.knowledgeLevel || 'Beginner'}
- Positions: ${memory.currentPosition?.verseKey || 'Overview'}

FORMATTING: 
- Use structured markdown (headers, bold, bullets).
- Mimic the clean, professional visual style of ChatGPT/Gemini.

BREVITY: Be concise but thorough in 'Detailed' mode. 

NAVIGATION:
- [[NAVIGATE:/path]] (LOWERCASE)
- [[OFFER_NAVIGATE:/path|Label]]
`;

    return basePrompt + contextSection;
}
