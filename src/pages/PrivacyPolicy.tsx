import { Footer } from "@/components/layout/Footer";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="glass-card p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Quran. We respect your privacy and are committed to protecting your personal
              data. This privacy policy explains how we handle information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We collect minimal information to provide and improve our service:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Reading preferences and progress (stored locally by default)</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Account information if you choose to sign up</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <span>Anonymous usage analytics to improve the service</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information is used solely to provide and improve your Quran reading experience.
              We do not sell or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Data Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              By default, your reading progress and preferences are stored locally on your device.
              If you create an account, your data may be stored securely on our servers to enable
              syncing across devices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to remember your preferences and provide a better experience.
              We do not use cookies for tracking or advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, update, or delete your personal information at any time.
              Contact us if you wish to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@quran.app" className="text-primary hover:underline">
                privacy@quran.app
              </a>
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
