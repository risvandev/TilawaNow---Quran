import { useNavigate } from "react-router-dom";
import { Shield, Lock, Eye, Server, ChevronLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: December 2024</p>
          </div>

          <div className="space-y-10">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                1. Our Commitment to Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At Tadabbur, we consider your privacy a sacred trust. We are dedicated to providing a spiritual environment free from the distractions of data mining and intrusive tracking. We collect only the absolute minimum amount of information necessary to provide you with a seamless experience.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-accent" />
                2. Information We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We believe in transparency. Here is exactly what we collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Account Information:</strong> If you sign up, we verify your email address to secure your account.
                </li>
                <li>
                  <strong className="text-foreground">Progress Data:</strong> We store your reading history, bookmarks, and streaks locally or synced to your account so you can pick up where you left off.
                </li>
                <li>
                  <strong className="text-foreground">Preferences:</strong> Your settings for font size, recitation, and theme are saved to enhance your experience.
                </li>
              </ul>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Server className="w-6 h-6 text-blue-500" />
                3. How We Use Your Data
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data is used solely for the purpose of maintaining your personal experience on Tadabbur. We do NOT sell, rent, or share your personal data with third-party advertisers or data brokers. Your reading habits are private to you.
              </p>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-green-500" />
                4. Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your information. All data transmission is encrypted. However, please remember that no method of transmission over the internet is 100% secure.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Cookies & Local Storage</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use local storage and essential cookies only to keep you logged in and remember your preferences. We do not use tracking cookies for cross-site retargeting.
              </p>
            </section>

            {/* Contact */}
            <div className="bg-secondary/20 rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-foreground mb-2">Have Questions?</h3>
              <p className="text-muted-foreground text-sm">
                If you have any questions about our privacy practices, please contact us at <a href="mailto:privacy@tadabbur.com" className="text-primary hover:underline">privacy@tadabbur.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
