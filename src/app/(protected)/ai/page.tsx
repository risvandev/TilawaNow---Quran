"use client";

import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Send, 
  Compass, 
  ArrowRight
} from "lucide-react";

import { chatWithAI, streamChatWithAI, ChatMessage, generateCompanionSystemPrompt } from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";
import { useAICompanion } from "@/contexts/AICompanionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const QURAN_EXPERT_PROMPT = `SYSTEM PROMPT — TilawaNow Islamic Assistant

You are a knowledgeable, respectful Islamic assistant. 
PRINCIPLE: Be EXTREMELY concise.

KNOWLEDGE OF APP:
- Current Page: AI Assistant (/ai)
- Direct Go: Use [[NAVIGATE:/path]] only if user says "Take me to", "Go to", etc.
- Polite Offers: If user asks about a page, describe it, say "If you like, I can do this for you (take you there)", then append [[OFFER_NAVIGATE:/path|Label]].

ROUTES: Landing Page (/), App Home (/home), Reading (/read), Dashboard (/dashboard), Settings (/settings), About (/about), Help (/help), Contact (/contact).
DYNAMIC ROUTES: Info (/info/surahId), Story (/story/surahId).
IMPORTANT: Always start paths with / (e.g., /read, not read). Use LOWERCASE.
`;

const sanitizePath = (path: string) => {
  // If the AI mixed formats and included a pipe (e.g. /path|Label)
  let rawPath = path.split("|")[0];
  let cleaned = rawPath.trim().toLowerCase();
  
  if (!cleaned.startsWith("/") && !cleaned.startsWith("http")) {
    cleaned = "/" + cleaned;
  }
  return cleaned;
};

const MessageWithOffers = ({ content, onNavigate }: { content: string, onNavigate: (path: string, label: string) => void }) => {
  const offerRegex = /\[\[OFFER_NAVIGATE:\s*(.*?)\s*\|\s*(.*?)\s*\]\]/g;
  const cleanText = (content || "").replace(offerRegex, "").trim();
  const offers: { path: string, label: string }[] = [];
  
  const matches = Array.from((content || "").matchAll(offerRegex));
  matches.forEach(match => {
    offers.push({ path: match[1], label: match[2] });
  });

  return (
    <div className="space-y-4">
      <div className="markdown-content">
        <ReactMarkdown>{cleanText}</ReactMarkdown>
      </div>
      {offers.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {offers.map((offer, i) => (
            <Button 
              key={i} 
              variant="hero" 
              size="sm" 
              className="rounded-xl flex items-center gap-2 group/btn"
              onClick={() => onNavigate(offer.path, offer.label)}
            >
              <span>{offer.label}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const AIAssistance = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentContext, userAIMemory } = useAICompanion();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const timelineNodes = useMemo(() => {
    return messages
      .map((msg, idx) => ({ ...msg, originalIndex: idx }))
      .filter(msg => msg.role === "user");
  }, [messages]);

  useEffect(() => {
    if (mounted && messages.length === 0 && !isLoading) {
      const welcomeText = userAIMemory.knowledgeLevel === "Beginner" 
        ? "Assalamu Alaikum! I'm your Quran companion. Ready to explore Al-Fatiha?"
        : `Assalamu Alaikum! Welcome back. How's your focus today?`;

      setMessages([{ role: "assistant", content: welcomeText }]);
      handleGenerateSuggestions();
    }
  }, [mounted, userAIMemory.knowledgeLevel]);

  useEffect(() => {
    if (mounted) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading, mounted]);

  const handleGenerateSuggestions = async () => {
    if (isGeneratingSuggestions) return;
    setIsGeneratingSuggestions(true);
    try {
      const response = await chatWithAI([
        { role: "system", content: "Return ONLY a JSON array of 3 short questions. Max 5 words each." },
        { role: "user", content: "Suggest 3 Quran questions." }
      ]);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) setSuggestions(JSON.parse(jsonMatch[0]));
    } catch (e) {
      setSuggestions(["Themes of this Ayah?", "Prophet stories?", "Historical context?"]);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const executeNavigation = (path: string, label: string) => {
    const targetPath = sanitizePath(path);
    toast({ title: "Redirecting", description: `Opening ${label} (${targetPath})...` });
    router.push(targetPath);
  };

  const handleSend = async (messageOverride?: string) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const fullSystemPrompt = generateCompanionSystemPrompt(
        { ...userAIMemory, currentPosition: currentContext.verseKey ? { 
            surahId: currentContext.surahId!, 
            ayahNumber: currentContext.ayahNumber!, 
            verseKey: currentContext.verseKey 
          } : undefined 
        }, 
        QURAN_EXPERT_PROMPT
      );

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let fullResponse = "";
      await streamChatWithAI(
        [ { role: "system", content: fullSystemPrompt }, ...newMessages.slice(-5) ],
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              const displayContent = fullResponse.replace(/\[\[NAVIGATE:.*?\]\]/g, "").trim();
              updated[lastIndex] = { ...updated[lastIndex], content: displayContent };
            }
            return updated;
          });
        }
      );

      const navMatch = fullResponse.match(/\[\[NAVIGATE:\s*(.*?)\s*\]\]/);
      if (navMatch && navMatch[1]) {
        const targetPath = sanitizePath(navMatch[1]);
        toast({ title: "Auto-Navigating", description: `Taking you to ${targetPath}...` });
        setTimeout(() => router.push(targetPath), 1000);
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-transparent pt-4 md:pt-16 pb-40">
        
        {/* Chat Timeline */}
        <div className="hidden lg:flex fixed right-10 top-1/2 -translate-y-1/2 flex-col items-center gap-2 z-30 py-2">
          {timelineNodes.map((node, i) => (
            <Tooltip key={i} delayDuration={50}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    const el = document.getElementById(`message-${node.originalIndex}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="w-6 h-6 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group"
                >
                  <span className="text-primary text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">—</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-popover/90 backdrop-blur-md border-primary/20 max-w-[200px]">
                <p className="text-xs line-clamp-2">{node.content}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="w-full md:max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">TilawaNow AI</h1>
            <p className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Efficiency Mode Active
            </p>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 animate-fade-in">
              {suggestions.map((s, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  className="whitespace-nowrap rounded-full text-[10px] md:text-xs h-8 px-4 bg-secondary/50 border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all" 
                  onClick={() => handleSend(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}

          {/* Message History */}
          <div className="space-y-6 pb-32 md:pb-20">
            {messages.map((message, index) => {
              if (message.role === "assistant" && !message.content) return null;
              
              return (
                <div key={index} id={`message-${index}`} className={`flex gap-3 animate-fade-in-up ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${message.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "glass-card rounded-bl-none border border-primary/10 shadow-md"}`}>
                    <div className="text-sm md:text-base leading-relaxed selection:bg-primary/30">
                      {message.role === "assistant" ? (
                        <MessageWithOffers content={message.content || ""} onNavigate={executeNavigation} />
                      ) : (
                        <div className="markdown-content">
                          <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Loader */}
          {isLoading && messages[messages.length-1]?.content === "" && (
            <div className="flex justify-start animate-fade-in px-2">
              <div className="flex items-center gap-3 py-2">
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-primary animate-spin-slow" />
                  <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full animate-ping" />
                </div>
                <span className="text-xs font-medium text-muted-foreground/60 italic">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-700" />
            <div className="relative">
              <Textarea
                placeholder="Ask about pages or Quran..."
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="min-h-[56px] max-h-[160px] bg-secondary/90 backdrop-blur-md border-border/50 resize-none py-4 pr-14 rounded-2xl focus-visible:ring-1 shadow-2xl text-sm md:text-base text-foreground font-medium"
              />
              <Button 
                variant="hero" 
                size="icon" 
                onClick={() => handleSend()} 
                disabled={!input.trim() || isLoading} 
                className="absolute right-2 bottom-2 h-10 w-10 rounded-xl shadow-xl hover:shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                <Send className="w-5 h-5 text-primary-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AIAssistance;
