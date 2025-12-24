import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, MessageSquare, CheckCircle, Heart, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import emailjs from "@emailjs/browser";
import { Footer } from "@/components/layout/Footer";

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
            to_name: "Tadabbur Team",
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
              subject: "We received your message - Tadabbur",
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
      <div className="container mx-auto px-6 py-8 max-w-4xl">
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
          <div className="glass-card p-6">
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
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Email Us Directly</h3>
              <a
                href="mailto:contact@quran.app"
                className="flex items-center gap-3 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">contact@quran.app</p>
                  <p className="text-sm text-muted-foreground">Click to open your email app</p>
                </div>
              </a>
            </div>

            {/* Feedback */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Share Feedback</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Your feedback helps us improve. Let us know what features you'd like to see
                or how we can make your experience better.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open("https://forms.gle/YourFeedbackFormLink", "_blank")}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            </div>

            {/* Response Time */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Response Time</h3>
              <p className="text-muted-foreground text-sm">
                We typically respond within 24-48 hours. For urgent matters, please mention
                "URGENT" in your subject line.
              </p>
            </div>
          </div>
        </div>

        {/* Support / Donation Section */}
        <div className="glass-card p-8 mt-8 text-center bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Support Tadabbur</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            This platform is built and maintained voluntarily to help people read and understand the Qur’an. If you find it beneficial and wish to support its development or future improvements, you may do so voluntarily.
            <br /><br />
            Access to the Qur’an will <strong className="text-foreground">always remain free forever</strong>.
          </p>
          <div className="flex justify-center">
            <Button variant="hero" size="lg" className="min-w-[200px]" onClick={() => window.open("https://www.buymeacoffee.com", "_blank")}>
              Donate Now
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
