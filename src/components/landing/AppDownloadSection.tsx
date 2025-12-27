import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { usePWA } from "@/contexts/PWAContext";

export const AppDownloadSection = () => {
    const { install, isInstallable } = usePWA();

    return (
        <section className="py-16 md:py-24 bg-card/50 border-t border-border/50">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20">

                    {/* Phone Mock Image - Left/Top */}
                    <div className="w-full md:w-1/2 flex justify-center md:justify-end animate-fade-in-up">
                        <div className="relative max-w-[300px] md:max-w-sm">
                            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-50" />
                            <img
                                src="/phone_mock.png"
                                alt="TilawaNow App Interface"
                                className="relative z-10 w-full h-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Content - Right/Bottom */}
                    <div className="w-full md:w-1/2 text-center md:text-left animate-fade-in-up delay-100">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                            Take the Quran <br className="hidden md:block" />
                            <span className="text-primary">With You Anywhere</span>
                        </h2>

                        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
                            Experience the best of TilawaNow on your device. Enjoy offline reading,
                            background audio, and a focused spiritual journey wherever you go.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                            <Button
                                size="lg"
                                className="h-14 px-8 text-lg gap-3 rounded-full shadow-lg hover:shadow-primary/25 transition-all"
                                onClick={install}
                                disabled={!isInstallable}
                            >
                                <Download className="w-6 h-6" />
                                {isInstallable ? "Download App" : "App Installed"}
                            </Button>
                        </div>

                        <p className="mt-6 text-sm text-muted-foreground/60">
                            Available for install on iOS and Android via browser
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
};
