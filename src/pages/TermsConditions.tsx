import { Footer } from "@/components/layout/Footer";
import { FileText } from "lucide-react";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="glass-card p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using this Quran platform, you accept and agree to be bound by these
              Terms and Conditions. If you do not agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              This platform is provided for personal, non-commercial use to:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Read and study the Holy Quran</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Listen to Quran recitations</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Access translations and understand meanings</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Track personal reading progress</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Content Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to ensure the accuracy of Quranic text, translations, and audio. However, for
              religious guidance and rulings, please consult qualified Islamic scholars. Translations
              are interpretations and may not capture the full depth of the Arabic original.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Quran is the word of Allah and is not subject to copyright. Translations and audio
              recitations are provided through the Quran.com API and remain the property of their
              respective creators. Our platform design and code are our intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users agree to use this platform respectfully and in accordance with Islamic values.
              Any misuse, including but not limited to attempting to modify Quranic content or using
              the service for harmful purposes, is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to keep the service available at all times but cannot guarantee uninterrupted
              access. We reserve the right to modify or discontinue features without notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              This service is provided "as is" without warranties of any kind. We are not liable for
              any damages arising from the use of this platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these terms from time to time. Continued use of the service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@quran.app" className="text-primary hover:underline">
                legal@quran.app
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsConditions;
