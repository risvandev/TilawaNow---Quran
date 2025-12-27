import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, MessageSquare, CheckCircle, Heart, ChevronLeft, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { Footer } from "@/components/layout/Footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Contact = () => {
  const navigate = useNavigate();
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
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID, // Re-using general template or create new one
        {
          from_name: "Anonymous Feedback",
          subject: "User Feedback",
          message: feedbackText,
          to_name: "TilawaNow Team",
          submitted_at: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      setIsFeedbackOpen(false);
      setFeedbackText("");
      toast({
        title: "Feedback Received",
        description: "Thank you! Your feedback helps us improve.",
      });
    } catch (error) {
      console.error("Feedback error:", error);
      toast({
        variant: "destructive",
        title: "Failed to send",
        description: "Please try again later.",
      });
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Send Admin Notification
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            from_name: formData.name,
            from_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            to_name: "TilawaNow Team",
            submitted_at: new Date().toLocaleString(),
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (adminError: any) {
        console.error("Admin Email Failed:", adminError);
        throw new Error(`Admin Email Failed: ${adminError?.text || "Unknown error"}`);
      }

      // 2. Send User Auto-Reply (Confirmation)
      if (import.meta.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID) {
        try {
          await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID,
            {
              to_name: formData.name,
              to_email: formData.email,
              subject: "We received your message - TilawaNow",
              message_preview: formData.message.substring(0, 50) + "...",
              submitted_at: new Date().toLocaleString(),
            },
            import.meta.env.VITE_EMAILJS_PUBLIC_KEY
          );
        } catch (replyError) {
          console.warn("Auto-reply failed (non-critical):", replyError);
          // Don't stop the success flow for auto-reply failure
        }
      }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 -ml-4 pl-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="glass-card p-4 md:p-6">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-4">
                  Your message has been sent successfully. We'll respond soon.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                  <Input
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your message..."
                    required
                    rows={5}
                    className="bg-secondary border-border resize-none"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info & Feedback */}
          <div className="space-y-6">
            {/* Email */}
            <div className="glass-card p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">Email Us Directly</h3>
              <a
                href="mailto:contact@quran.app"
                className="flex items-center gap-3 p-3 md:p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm md:text-base">contact@quran.app</p>
                  <p className="text-xs text-muted-foreground md:hidden">Tap to send</p>
                  <p className="text-sm text-muted-foreground hidden md:block">Click to open your email app</p>
                </div>
              </a>
            </div>

            {/* Feedback */}
            <div className="glass-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Share Feedback</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Your insights help us grow. Tell us how we can improve.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsFeedbackOpen(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </div>

            {/* Response Time */}
            <div className="glass-card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Response Time</h3>
              <p className="text-muted-foreground text-sm">
                We typically respond within 24-48 hours. For urgent matters, please mention
                "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </div>

        {/* Support / Donation Section */}
        <div className="glass-card p-4 md:p-8 mt-8 text-center bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 md:mb-6">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary fill-primary/20" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Support Tadabbur</h2>

          {/* Mobile Text (Short) */}
          <p className="md:hidden text-muted-foreground text-sm max-w-xs mx-auto mb-6 leading-relaxed">
            Built voluntarily to serve the Qur’an. Support is optional,<br /> access is <strong className="text-foreground">forever free</strong>.
          </p>

          {/* Desktop Text (Long) */}
          <p className="hidden md:block text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            This platform is built and maintained voluntarily to help people read and understand the Qur’an. If you find it beneficial and wish to support its development or future improvements, you may do so voluntarily.
            <br /><br />
            Access to the Qur’an will <strong className="text-foreground">always remain free forever</strong>.
          </p>
          <div className="flex justify-center">
            <Button variant="hero" size="lg" className="min-w-[200px]" onClick={() => setIsDonateOpen(true)}>
              Donate Now
            </Button>
          </div>
        </div>
      </div>
      <Footer />

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Share Feedback
            </DialogTitle>
            <DialogDescription>
              We'd love to hear your thoughts. What can we improve?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="I think you should add..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={handleFeedbackSubmit} disabled={isFeedbackSubmitting || !feedbackText.trim()}>
                {isFeedbackSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Donate Dialog (Minimal) */}
      <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
        <DialogContent className="sm:max-w-sm w-[90%] bg-card border-border p-5 gap-0 shadow-xl rounded-2xl mx-auto">
          <div className="flex flex-col items-center text-center">

            <DialogTitle className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-primary fill-primary/20" />
              Support Tadabbur
            </DialogTitle>

            <DialogDescription className="text-muted-foreground text-xs mx-auto mb-4 leading-tight">
              Your contribution helps keep the Qur'an accessible.
            </DialogDescription>

            {/* QR Code - Minimal & Clean */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-neutral-100 mb-3">
              <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/TilawaNow_qr_code.png" alt="Donate QR Code" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Mobile UPI Button */}
            <div className="md:hidden w-full mb-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 rounded-xl"
                onClick={() => {
                  const upiId = "your-upi-id@bank";
                  const name = "TilawaNow";
                  const url = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
                  window.location.href = url;
                }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Pay via UPI App
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground font-medium opacity-60">
              Secure Donation
            </p>

          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex justify-center">
            <button
              onClick={() => setIsDonateOpen(false)}
              className="text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
