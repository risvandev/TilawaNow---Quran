import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, User, Bot, BookOpen } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistance = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Assalamu Alaikum! I'm here to help you understand the Quran better. You can ask me about:\n\n• The meaning and context of specific verses\n• The stories of prophets mentioned in the Quran\n• Islamic concepts and teachings\n• The historical context of revelations\n\nHow can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (in production, this would call an actual AI API)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Thank you for your question. To provide AI-powered responses about the Quran, this feature requires backend integration. Once connected to Lovable Cloud with AI capabilities, I'll be able to help you understand Quran verses, their meanings, contexts, and related teachings in depth.\n\nFor now, you can explore the Read Quran section to access all surahs with translations and audio recitation.",
        },
      ]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-6 py-8 flex-1 flex flex-col max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">AI Quran Assistant</h1>
          <p className="text-muted-foreground">
            Ask questions about the Quran and get meaningful insights
          </p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "glass-card"
                }`}
              >
                <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="glass-card rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="glass-card p-4">
          <div className="flex gap-3">
            <Textarea
              placeholder="Ask about any verse, surah, or Islamic concept..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[50px] max-h-[150px] bg-secondary border-border resize-none"
            />
            <Button
              variant="hero"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistance;
