"use client";

import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Send,
  Compass,
  ArrowRight,
  Zap,
  BookOpen,
  GraduationCap,
  Info,
  History,
  ChevronDown,
  X,
  Quote,
  Copy
} from "lucide-react";

import getPuter from "@/lib/puter-service";
import {
  chatWithAI,
  streamChatWithAI,
  ChatMessage,
  generateCompanionSystemPrompt,
  AIChatMode
} from "@/lib/ai-service";
import { useToast } from "@/hooks/use-toast";
import { useAICompanion } from "@/contexts/AICompanionContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const QURAN_EXPERT_PROMPT = `SYSTEM PROMPT — TilawaNow Islamic Assistant

You are a grounded, reliable Quranic companion. 
Your primary goal is to help users understand the Quran through verified classical interpretations.

OPERATING MODES:
1. QUICK: Brief, direct answers based on reliable translations.
2. DETAILED: Thorough reasoning grounded in primary Quranic text AND classical Tafsir (Ibn Kathir, Al-Jalalayn).
3. RESEARCH: High-level academic analysis with fallback to web search ONLY for modern scholarly context. Always prioritize classical sources first.

STRICT PROTOCOL:
- Never invent interpretations (hallucinate).
- If grounded context is provided (tafsir segments), summarize and simplify them using the structured output format.
- Maintain academic rigor and respectful tone.
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

  // AI Modes & State
  const [chatMode, setChatMode] = useState<AIChatMode>("Quick");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Contextual Follow-up State
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [selectionPopup, setSelectionPopup] = useState<{ text: string, x: number, y: number } | null>(null);

  // Puter State
  const [isPuterReady, setIsPuterReady] = useState(false);
  const [isPuterSignedIn, setIsPuterSignedIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Puter from SDK
  useEffect(() => {
    if (mounted) {
      const checkPuter = () => {
        const p = getPuter();
        if (p) {
          setIsPuterReady(true);
          const signedIn = p.auth.isSignedIn();
          setIsPuterSignedIn(signedIn);
          setShowOnboarding(!signedIn);
          return true;
        }
        return false;
      };

      if (!checkPuter()) {
        const interval = setInterval(() => {
          if (checkPuter()) clearInterval(interval);
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [mounted, toast]);

  const timelineNodes = useMemo(() => {
    return (messages || [])
      .map((msg, idx) => ({ ...msg, originalIndex: idx }))
      .filter(msg => msg?.role === "user");
  }, [messages]);

  useEffect(() => {
    if (isPuterSignedIn && (messages?.length || 0) === 0 && !isLoading) {
      const welcomeText = userAIMemory?.knowledgeLevel === "Beginner"
        ? "Assalamu Alaikum! I'm your Quran companion. Ready to explore Al-Fatiha?"
        : `Assalamu Alaikum! Welcome back ${user?.email?.split('@')[0] || ''}. How's your focus today?`;

      setMessages([{ role: "assistant", content: welcomeText }]);
      handleGenerateSuggestions();
    }
  }, [isPuterSignedIn, userAIMemory?.knowledgeLevel, user?.email]);

  useEffect(() => {
    if (mounted) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading, mounted]);

  // Handle Text Selection for Contextual Follow-up
  useEffect(() => {
    if (!mounted) return;

    const handleMouseUp = () => {
      // Small timeout to allow the browser to finalize selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          setSelectionPopup(null);
          return;
        }

        const selectedText = selection.toString().trim();
        if (selectedText.length < 3) {
          setSelectionPopup(null);
          return;
        }

        // Ensure selection is inside an AI assistant response area
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer as HTMLElement;

        if (!(container as HTMLElement)?.closest('.ai-response-content')) {
          setSelectionPopup(null);
          return;
        }

        const rect = range.getBoundingClientRect();
        setSelectionPopup({
          text: selectedText,
          x: rect.left + rect.width / 2 + window.scrollX,
          y: rect.top + window.scrollY
        });
      }, 50);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [mounted]);

  const handlePuterSignIn = async () => {
    const p = getPuter();
    if (!p) return;
    try {
      await p.auth.signIn();
      setIsPuterSignedIn(true);
      setShowOnboarding(false);
      toast({ title: "Connected", description: "Successfully linked to your Puter account." });
    } catch (e: any) {
      // Users often close the popup or cancel, so we silently handle it 
      // instead of showing a scary red error toast.
      console.log("Puter authentication dismissed or failed:", e);
    }
  };

  const handleGenerateSuggestions = async () => {
    if (isGeneratingSuggestions || !getPuter()?.auth?.isSignedIn()) return;
    setIsGeneratingSuggestions(true);
    try {
      const response = await chatWithAI([
        { role: "system", content: "Return ONLY a JSON array of 3 short Quranic exploration questions. Max 5 words each." },
        { role: "user", content: "Suggest 3 Quran questions." }
      ], { mode: 'Quick' });
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

  const handleSend = async (messageOverride?: string, forceMode?: AIChatMode) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage || isLoading) return;

    const mode = forceMode || chatMode;
    setInput("");

    let finalMessage = userMessage;
    if (quotedText) {
      finalMessage = `> ${quotedText}\n\n${userMessage}`;
      setQuotedText(null);
    }

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: finalMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const fullSystemPrompt = generateCompanionSystemPrompt(
        {
          ...userAIMemory, currentPosition: currentContext.verseKey ? {
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
        [{ role: "system", content: fullSystemPrompt }, ...newMessages.slice(-5)],
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
        },
        {
          mode: mode,
          verseKey: currentContext.verseKey || undefined
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
      <div className={cn(
        "min-h-screen bg-transparent transition-all duration-700 relative",
        showOnboarding ? "flex items-center justify-center pt-0 pb-0 px-4" : "pt-4 md:pt-16 pb-40"
      )}>

        {/* Floating Follow-up Button */}
        {selectionPopup && (
          <div
            className="absolute z-[100] animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
            style={{
              left: `${selectionPopup.x}px`,
              top: `${selectionPopup.y - 48}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="relative pointer-events-auto">
              <Button
                size="sm"
                variant="hero"
                className="rounded-full shadow-2xl flex items-center gap-2 h-9 px-4 bg-primary/95 backdrop-blur-md border border-white/10"
                onClick={() => {
                  setQuotedText(selectionPopup.text);
                  setSelectionPopup(null);
                  window.getSelection()?.removeAllRanges();
                }}
              >
                <Quote className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Ask about this</span>
              </Button>
              {/* Caret/Arrow pointing down */}
              <div
                className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-primary/95 rotate-45 border-r border-b border-white/10"
              />
            </div>
          </div>
        )}

        {showOnboarding ? (
          /* Seamless Auth Gate - No Box */
          <div className="max-w-md w-full mx-auto text-center space-y-12 animate-fade-in-up relative group px-6">
            {/* Ambient Glow */}
            <div className="absolute -inset-40 bg-primary/10 rounded-full blur-[120px] opacity-20 pointer-events-none" />

            <div className="flex items-center justify-center mx-auto mb-6 transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
              <Image
                src="/quran-logo.svg"
                alt="TilawaNow Logo"
                width={80}
                height={80}
                className="text-primary"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-foreground tracking-tight">Use AI in TilawaNow</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Get explanations, meanings, and guidance while reading.
                This feature runs on a secure AI service and may require a quick account connection.
              </p>
            </div>

            <div className="pt-4">
              <Button
                onClick={handlePuterSignIn}
                size="lg"
                variant="hero"
                className="w-full rounded-2xl text-lg h-14 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mb-4"
              >
                Connect & Continue
              </Button>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                Powered by Puter
              </p>
            </div>
          </div>
        ) : (
          /* Unlocked State - Full AI Interface */
          <div className="w-full">
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
                    <p className="text-xs line-clamp-2">{(node as any).content}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="w-full md:max-w-4xl mx-auto px-4 space-y-8">
              {/* Header */}
              <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">TilawaNow AI</h1>
              </div>

              {/* Active Context & Action Buttons */}
              <div className="space-y-4">
                {currentContext.verseKey && (
                  <div className="glass-card border border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">Active Context</p>
                        <p className="text-sm font-bold text-foreground">Verse {currentContext.verseKey}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="hero"
                        size="sm"
                        className="rounded-lg h-9 px-4 text-[11px] font-bold"
                        onClick={() => handleSend(`Explain verse ${currentContext.verseKey} in detail.`)}
                      >
                        Explain Ayah
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-lg h-9 px-4 text-[11px] font-bold"
                        onClick={() => handleSend(`What are the key practical lessons from verse ${currentContext.verseKey}?`)}
                      >
                        Lessons
                      </Button>
                    </div>
                  </div>
                )}

                {/* Suggestions / Quick Topics */}
                {suggestions.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                    {suggestions.map((s, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap rounded-full text-[10px] md:text-xs h-8 px-4 bg-secondary/30 border-primary/5 hover:border-primary/20 hover:bg-primary/5 transition-all"
                        onClick={() => handleSend(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message History */}
              <div className="space-y-8 pb-40 md:pb-32">
                {messages.map((message, index) => {
                  if (message.role === "assistant" && !message.content && isLoading && index === messages.length - 1) {
                    return (
                      <div key={index} className="flex justify-start animate-pulse">
                        <div className="glass-card rounded-2xl px-6 py-4 border border-primary/10 w-2/3">
                          <div className="space-y-2">
                            <div className="h-4 bg-primary/10 rounded w-full" />
                            <div className="h-4 bg-primary/10 rounded w-5/6" />
                            <div className="h-4 bg-primary/10 rounded w-4/6" />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (message.role === "assistant" && !message.content) return null;

                  return (
                    <div key={index} id={`message-${index}`} className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={cn(
                        "max-w-[90%] md:max-w-[80%] rounded-2xl px-6 py-4",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none shadow-xl shadow-primary/10"
                          : "bg-transparent border-none shadow-none"
                      )}>
                        <div className="text-sm md:text-base leading-relaxed selection:bg-primary/30">
                          {message.role === "assistant" ? (
                            <div className="ai-response-content">
                              <MessageWithOffers content={message.content || ""} onNavigate={executeNavigation} />
                              {message.role === "assistant" && message.content && !isLoading && (
                                <div className="flex justify-start mt-4 pt-2 border-t border-primary/5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-all rounded-lg group/copy"
                                    onClick={() => {
                                      navigator.clipboard.writeText(message.content || "");
                                      toast({ title: "Copied", description: "Response copied to clipboard." });
                                    }}
                                  >
                                    <Copy className="w-3.5 h-3.5 group-hover/copy:scale-110 transition-transform" />
                                  </Button>
                                </div>
                              )}
                            </div>
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
            </div>

            {/* AI Control Center & Input */}
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-background/95 to-transparent pt-20 pb-6 px-4">
              <div className="max-w-3xl mx-auto space-y-4">

                {/* Quoted Context Preview */}
                {quotedText && (
                  <div className="flex items-center gap-3 bg-secondary/50 backdrop-blur-xl border border-primary/20 rounded-xl p-2 px-4 animate-in slide-in-from-bottom-2 duration-300 group/quote shadow-2xl">
                    <div className="w-0.5 h-6 bg-primary rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80 italic truncate leading-relaxed">"{quotedText}"</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuotedText(null)}
                      className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {chatMode === "Research" && (
                  <div className="flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground font-bold uppercase tracking-widest cursor-help">
                            <Info className="w-3 h-3 text-muted-foreground" />
                            Research Mode: Ext. Sources Allowed
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs p-3">
                          Uses online search for comparative scholarly opinions. Higher AI credit usage. May include unverified modern opinions.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}

                {/* Input Bar */}
                <div className="relative group">
                  <div className="relative">
                    <Textarea
                      placeholder={currentContext.verseKey ? `Ask about Verse ${currentContext.verseKey}...` : "Ask about the Quran..."}
                      value={input}
                      rows={1}
                      disabled={isLoading}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      className="min-h-[64px] max-h-[180px] bg-secondary/95 backdrop-blur-2xl border-border/40 resize-none py-5 pl-6 pr-36 rounded-[1.5rem] focus-visible:ring-1 shadow-2xl text-base text-foreground font-medium placeholder:text-muted-foreground/40 disabled:opacity-50 transition-all focus:border-primary/30"
                    />

                    <div className="absolute right-3 bottom-3 flex items-center gap-2">
                      {/* Mode Selector Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 px-2 flex items-center gap-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-tight">{chatMode}</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 glass-card border-primary/20 rounded-2xl">
                          <DropdownMenuItem
                            onClick={() => setChatMode("Quick")}
                            className={cn(
                              "flex flex-col items-start p-3 rounded-xl cursor-pointer transition-colors",
                              chatMode === "Quick" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                            )}
                          >
                            <span className="text-xs font-bold">Quick Mode</span>
                            <span className="text-[10px] opacity-60">Fast, direct answers</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setChatMode("Detailed")}
                            className={cn(
                              "flex flex-col items-start p-3 rounded-xl cursor-pointer transition-colors",
                              chatMode === "Detailed" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                            )}
                          >
                            <span className="text-xs font-bold">Detailed Mode</span>
                            <span className="text-[10px] opacity-60">Classical Tafsir grounding</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setChatMode("Research")}
                            className={cn(
                              "flex flex-col items-start p-3 rounded-xl cursor-pointer transition-colors",
                              chatMode === "Research" ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                            )}
                          >
                            <span className="text-xs font-bold">Research Mode</span>
                            <span className="text-[10px] opacity-60">Includes web fallbacks</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="h-11 w-11 rounded-2xl hover:bg-primary/10 transition-all hover:scale-105 active:scale-95"
                      >
                        <Send className="w-5 h-5 text-primary" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AIAssistance;
