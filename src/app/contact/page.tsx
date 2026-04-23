"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, CheckCircle, Heart, ChevronLeft, Clock, Sparkles, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/layout/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Contact = () => {
  const navigate = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Feedback Dialog State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsFeedbackSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Anonymous Feedback",
          email: "tilawanow@gmail.com", // Placeholder for feedback
          subject: "User Feedback",
          message: feedbackText,
        }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to send");

      setIsFeedbackOpen(false);
      setFeedbackText("");
      toast({
        title: "Feedback Received",
        description: "Thank you! Your feedback helps us improve.",
      });
    } catch (error: any) {
      console.error("Feedback error:", error);
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to send");

      setSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: error.message || "Please check your connection.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/4 -right-[10%] w-[500px] h-[500px] bg-accent/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="flex-1 container mx-auto px-4 md:px-6 py-12 md:py-20 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col items-center mb-16 animate-fade-in">
          <button
            onClick={() => navigate.back()}
            className="group self-start inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-10 transition-all duration-300 px-5 py-2 rounded-full hover:bg-secondary/80 border border-transparent hover:border-border/50"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Return to Discovery</span>
          </button>

          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
          <h1 className="text-4xl md:text-7xl font-bold text-foreground mb-4 tracking-tighter text-center">
            Let's <span className="gradient-text">Contact</span>
          </h1>
        </div>

        <div className="max-w-xl mx-auto w-full group/container">
          {/* Main Form Clean Layout */}
          <div className={cn(
            "p-0 relative transition-all duration-500",
            !submitted && "animate-fade-in-up"
          )}>
            
            {submitted ? (
              <div className="text-center py-12 animate-fade-in-up glass-card p-10">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Message Received</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Thank you for reaching out. We've received your message and will get back to you shortly.
                </p>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" size="lg" className="rounded-xl" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                  <Button variant="ghost" size="lg" className="rounded-xl" onClick={() => navigate.back()}>
                    Return Home
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3 group/field">
                  <label className="text-sm font-bold text-foreground/70 ml-1 group-focus-within/field:text-primary transition-colors uppercase tracking-wider">Your Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                    className="h-14 bg-transparent border-none border-b border-border/60 hover:border-primary/30 focus:border-primary focus:ring-0 rounded-none px-1 transition-all duration-300 text-lg"
                  />
                </div>
                
                <div className="space-y-3 group/field">
                  <label className="text-sm font-bold text-foreground/70 ml-1 group-focus-within/field:text-primary transition-colors uppercase tracking-wider">Email Address</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    required
                    className="h-14 bg-transparent border-none border-b border-border/60 hover:border-primary/30 focus:border-primary focus:ring-0 rounded-none px-1 transition-all duration-300 text-lg"
                  />
                </div>

                <div className="space-y-3 group/field">
                  <label className="text-sm font-bold text-foreground/70 ml-1 group-focus-within/field:text-primary transition-colors uppercase tracking-wider">Subject</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Briefly describe your inquiry"
                    required
                    className="h-14 bg-transparent border-none border-b border-border/60 hover:border-primary/30 focus:border-primary focus:ring-0 rounded-none px-1 transition-all duration-300 text-lg"
                  />
                </div>

                <div className="space-y-3 group/field">
                  <label className="text-sm font-bold text-foreground/70 ml-1 group-focus-within/field:text-primary transition-colors uppercase tracking-wider">Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you today?"
                    required
                    rows={6}
                    className="bg-transparent border-none border-b border-border/60 hover:border-primary/30 focus:border-primary focus:ring-0 rounded-none px-1 transition-all duration-300 resize-none py-4 text-lg"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-14 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/20 group-hover/container:scale-[1.01] transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                      <span>Send Message</span>
                    </div>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Minimal Info Row */}
          {!submitted && (
            <div className="grid grid-cols-2 gap-4 mt-8 animate-fade-in delay-500 fill-mode-forwards opacity-0">
              <div className="glass-card p-5 flex flex-col items-center text-center gap-3 border-primary/5 hover:border-primary/20 transition-colors">
                <Clock className="w-6 h-6 text-primary/60" />
                <div>
                  <p className="text-xs font-bold text-foreground">Response Time</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Usually within 24-48h</p>
                </div>
              </div>
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="glass-card p-5 flex flex-col items-center text-center gap-3 border-primary/5 hover:border-primary/20 hover:bg-secondary/30 transition-all group"
              >
                <MessageSquare className="w-6 h-6 text-primary/60 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold text-foreground">Share Feedback</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">Help us improve the app</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Support Call to Action - Clean Layout */}
        <div className="max-w-4xl mx-auto mt-20 md:mt-32">
          <div className="relative p-0 text-center overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-10 shadow-inner">
                <Heart className="w-10 h-10 text-primary fill-primary/20" />
              </div>

              <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tighter">Support TilawaNow</h2>

              <p className="text-muted-foreground text-xl mb-12 leading-relaxed max-w-xl opacity-80">
                TilawaNow is built and maintained voluntarily to spread the light of the Qur’an.
                If you find this tool beneficial, your voluntary support helps us keep it <strong className="text-foreground">free forever</strong>.
              </p>

              <Button
                variant="hero"
                size="xl"
                className="rounded-2xl px-12 h-16 text-xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
                onClick={() => setIsDonateOpen(true)}
              >
                <Sparkles className="mr-2 w-6 h-6" />
                Donate Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>

      {/* Enhanced Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border p-8 rounded-[2rem] shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">Share Feedback</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              What features would you like to see? How can we make your experience better?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="I love the reading mode, but I think you should add..."
              className="min-h-[160px] bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-2xl p-4 resize-none transition-all duration-300"
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 rounded-xl h-12" onClick={() => setIsFeedbackOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleFeedbackSubmit}
                disabled={isFeedbackSubmitting || !feedbackText.trim()}
              >
                {isFeedbackSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Donate Dialog */}
      <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

          <div className="flex flex-col items-center text-center relative z-10 w-full">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-primary fill-primary/20" />
            </div>

            <DialogTitle className="text-3xl font-bold mb-3 tracking-tight">Support TilawaNow</DialogTitle>

            <DialogDescription className="text-muted-foreground text-base mb-6 max-w-[240px] leading-relaxed mx-auto">
              Your contribution helps keep the Qur'an accessible to everyone worldwide.
            </DialogDescription>

            {/* Premium QR Code Container */}
            <div className="relative group p-3 bg-white/5 rounded-3xl border border-border/50 mb-6 overflow-hidden transition-all duration-500 hover:border-primary/30">
              <div className="absolute inset-0 bg-primary/5 blur-xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <div className="relative bg-white p-3 rounded-2xl shadow-2xl">
                <div className="w-40 h-40 bg-white flex items-center justify-center overflow-hidden">
                  <img src="/TilawaNow_qr_code.png" alt="Donate QR Code" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>

            {/* Responsive Payment UI */}
            <div className="w-full">
              {/* Desktop/Tablet Text */}
              <div className="hidden sm:block mb-4">
                <p className="text-2xl font-bold text-foreground tracking-tight">Pay via UPI</p>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">Scan the QR code to donate</p>
              </div>

              {/* Mobile Button */}
              <div className="sm:hidden mb-4">
                <Button
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white gap-3 h-14 rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/10"
                  onClick={() => {
                    const upiId = "your-upi-id@bank";
                    const name = "TilawaNow";
                    const url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
                    window.location.href = url;
                  }}
                >
                  <QrCode className="w-6 h-6" />
                  Pay via UPI App
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-2 opacity-50 uppercase tracking-widest">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                Secure Transaction
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
