import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_CONFIG = {
  url: "https://openrouter.ai/api/v1/chat/completions",
  model: "nvidia/nemotron-nano-12b-v2-vl:free",
  keys: [
    process.env.NEXT_PUBLIC_AI_API_KEY,
    process.env.NEXT_PUBLIC_AI_API_KEY_SECONDARY
  ].filter(Boolean) as string[]
};

const GOOGLE_CONFIG = {
  streamUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent",
  restUrl: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
  key: process.env.NEXT_PUBLIC_GOOGLE_AI_KEY
};

const GROQ_CONFIG = {
  url: "https://api.groq.com/openai/v1/chat/completions",
  model: "llama3-70b-8192",
  key: process.env.NEXT_PUBLIC_GROQ_API_KEY
};

function formatGeminiMessages(messages: any[]) {
    const raw = messages.filter(m => m.role !== 'system');
    const firstUserIndex = raw.findIndex(m => m.role === 'user');
    if (firstUserIndex === -1) return [];

    const clean = raw.slice(firstUserIndex).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || "..." }]
    }));

    const system = messages.find(m => m.role === 'system');
    if (system && clean.length > 0) {
        clean[0].parts[0].text = `[SYSTEM INSTRUCTION: ${system.content}]\n\n${clean[0].parts[0].text}`;
    }
    return clean;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, stream = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    if (stream) {
      return await handleStreamingWaterfall(messages);
    } else {
      return await handleSingleShotWaterfall(messages);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}

async function handleStreamingWaterfall(messages: any[]) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        try { controller.enqueue(encoder.encode(text)); } catch (e) {}
      };

      const providers = [
        { name: "OR_P", type: "openai", url: OPENROUTER_CONFIG.url, key: OPENROUTER_CONFIG.keys[0], model: OPENROUTER_CONFIG.model },
        { name: "OR_S", type: "openai", url: OPENROUTER_CONFIG.url, key: OPENROUTER_CONFIG.keys[1], model: OPENROUTER_CONFIG.model },
        { name: "GEM", type: "gemini", url: GOOGLE_CONFIG.streamUrl, key: GOOGLE_CONFIG.key },
        { name: "GROQ", type: "openai", url: GROQ_CONFIG.url, key: GROQ_CONFIG.key, model: GROQ_CONFIG.model }
      ];

      for (const p of providers) {
        if (!p.key) continue;
        try {
          console.log(`[AI] Trying ${p.name}...`);
          if (p.type === "openai") {
            await streamOpenAI(p.url!, p.key, p.model!, messages, send);
          } else {
            await streamGemini(p.key, messages, send);
          }
          controller.close();
          return;
        } catch (e: any) {
          console.warn(`[AI] ${p.name} failed:`, e.message);
        }
      }

      // Instead of controller.error (which causes "Failed to fetch"), send a clean error string
      send("\n\n(Error: All AI providers are currently busy. Please try again in 30 seconds.)");
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

async function streamOpenAI(url: string, key: string, model: string, messages: any[], send: (t: string) => void) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const l of lines) {
      const c = l.replace(/^data: /, "").trim();
      if (!c || c === "[DONE]") continue;
      try {
        const p = JSON.parse(c);
        const t = p.choices[0]?.delta?.content;
        if (t) send(t);
      } catch (e) {}
    }
  }
}

async function streamGemini(key: string, messages: any[], send: (t: string) => void) {
  const contents = formatGeminiMessages(messages);
  if (contents.length === 0) throw new Error("empty");
  const res = await fetch(`${GOOGLE_CONFIG.streamUrl}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let s = buffer.indexOf('{');
    while (s !== -1) {
      let c = 0, e = -1;
      for (let i = s; i < buffer.length; i++) {
        if (buffer[i] === '{') c++; else if (buffer[i] === '}') c--;
        if (c === 0) { e = i; break; }
      }
      if (e !== -1) {
        try {
          const p = JSON.parse(buffer.substring(s, e + 1));
          const t = p.candidates?.[0]?.content?.parts?.[0]?.text;
          if (t) send(t);
        } catch (err) {}
        buffer = buffer.substring(e + 1);
        s = buffer.indexOf('{');
      } else break;
    }
  }
}

async function handleSingleShotWaterfall(messages: any[]) {
  const providers = [
    { name: "OR_P", type: "openai", url: OPENROUTER_CONFIG.url, key: OPENROUTER_CONFIG.keys[0], model: OPENROUTER_CONFIG.model },
    { name: "OR_S", type: "openai", url: OPENROUTER_CONFIG.url, key: OPENROUTER_CONFIG.keys[1], model: OPENROUTER_CONFIG.model },
    { name: "GEM", type: "gemini", url: GOOGLE_CONFIG.restUrl, key: GOOGLE_CONFIG.key },
    { name: "GROQ", type: "openai", url: GROQ_CONFIG.url, key: GROQ_CONFIG.key, model: GROQ_CONFIG.model }
  ];
  for (const p of providers) {
    if (!p.key) continue;
    try {
      if (p.type === "openai") {
        const res = await fetch(p.url!, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${p.key}` },
          body: JSON.stringify({ model: p.model, messages }),
        });
        if (res.ok) {
          const d = await res.json();
          return NextResponse.json({ content: d.choices?.[0]?.message?.content || "" });
        }
      } else {
        const contents = formatGeminiMessages(messages);
        if (contents.length === 0) continue;
        const res = await fetch(`${GOOGLE_CONFIG.restUrl}?key=${p.key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        });
        if (res.ok) {
          const d = await res.json();
          return NextResponse.json({ content: d.candidates?.[0]?.content?.parts?.[0]?.text || "" });
        }
      }
    } catch (e) {}
  }
  return NextResponse.json({ error: "Exhausted" }, { status: 503 });
}
