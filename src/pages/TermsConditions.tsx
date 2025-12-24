import { useNavigate } from "react-router-dom";
import { FileText, AlertCircle, CheckCircle, ChevronLeft } from "lucide-react";

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <div className="glass-card p-8 md:p-12 animate-fade-in-up">
          {/* Header */}
          <div className="mb-12 border-b border-border/50 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">Last Updated: December 2024</p>
          </div>

          <div className="space-y-10">
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Tadabbur, you agree to be bound by these Terms of Service. These terms apply to all visitors, users, and others who access the service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            {/* Use License */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-accent" />
                2. Use of Service
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tadabbur is provided for personal, spiritual, and educational use. You agree not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use the service for any illegal purpose or to violate any laws in your jurisdiction.</li>
                <li>Attempt to gain unauthorized access to any portion of the service or its systems.</li>
                <li>Harass, abuse, or harm another person or group.</li>
                <li>Spam or flood the service with excessive requests.</li>
              </ul>
            </section>

            {/* Content & Copyright */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Content & Copyright</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Quranic text and audio provided on this platform are public domain or used with permission from their respective sources. The design, code, and unique features of Tadabbur are copyright of the Tadabbur team.
              </p>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-500" />
                4. Disclaimer
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                While we strive for accuracy in the Quranic text and translations, Tadabbur is a human effort and may contain errors. If you find any errors in the text or audio, please report them so we can correct them immediately. We are not liable for any misunderstandings arising from the use of translations.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
              </p>
            </section>

            {/* Contact */}
            <div className="bg-secondary/20 rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-foreground mb-2">Contact Us</h3>
              <p className="text-muted-foreground text-sm">
                If you have any questions about these Terms, please contact us at <a href="mailto:support@tadabbur.com" className="text-primary hover:underline">support@tadabbur.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
