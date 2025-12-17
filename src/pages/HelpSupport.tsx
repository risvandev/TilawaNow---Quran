import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Search, Bot, User, Send, MessageSquare } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const faqs = [
  {
    question: "How do I start reading the Quran?",
    answer:
      "Simply navigate to the 'Read Quran' section from the sidebar or click 'Start Reading' on the home page. You can browse all 114 surahs, search for specific ones, or use our quick access shortcuts to popular surahs.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No! You can read, listen, and view translations without any account. Creating an account is only needed if you want to track your reading progress and sync across devices.",
  },
  {
    question: "How do I listen to Quran recitation?",
    answer:
      "When viewing any surah, you'll see an audio player. Click the play button to listen to professional recitation. You can choose from different reciters in the settings.",
  },
  {
    question: "How do I change the translation language?",
    answer:
      "Go to Settings from the sidebar, then under 'Language & Translation', select your preferred translation language from the dropdown menu.",
  },
  {
    question: "Is this service free?",
    answer:
      "Yes! This platform is completely free and will always remain free. We believe everyone should have easy access to the Holy Quran without any barriers.",
  },
  {
    question: "How does the AI Assistance work?",
    answer:
      "The AI Assistant helps you understand Quran verses better. You can ask questions about specific ayahs, their meanings, historical context, and related teachings. Simply type your question and get helpful explanations.",
  },
  {
    question: "Can I track my reading progress?",
    answer:
      "Yes! The Dashboard shows your reading statistics including ayahs read, current streak, and weekly goals. Your progress is saved locally, or you can sign in to sync across devices.",
  },
  {
    question: "Which reciters are available?",
    answer:
      "We offer recitations from renowned Qaris including Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Saud Al-Shuraim, and many more. You can change the reciter in the settings.",
  },
];

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm here to help you with any questions about using this website. How can I assist you today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate response
    setTimeout(() => {
      const responses = [
        "I'd be happy to help with that! You can find that feature in the sidebar navigation.",
        "Great question! To do that, simply go to Settings and look for the relevant option.",
        "Thanks for asking! This feature is available in the Read Quran section.",
        "I understand your concern. Try refreshing the page, and if the issue persists, please contact us.",
      ];
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responses[Math.floor(Math.random() * responses.length)] +
            " Is there anything else I can help you with?",
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Help & Support</h1>
          <p className="text-muted-foreground">Find answers or chat with our support assistant</p>
        </div>

        {/* Search FAQs */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search frequently asked questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-secondary border-border"
          />
        </div>

        {/* FAQs */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredFaqs.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No matching questions found. Try the support chat below.
            </p>
          )}
        </div>

        {/* Support Chat */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Support Chat</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Can't find your answer? Chat with our site support assistant.
          </p>

          {/* Chat Messages */}
          <div className="h-64 overflow-y-auto space-y-3 mb-4 p-4 rounded-lg bg-secondary/30">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-secondary rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Ask about using this website..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="bg-secondary border-border"
            />
            <Button variant="hero" size="icon" onClick={handleSendMessage} disabled={isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HelpSupport;
