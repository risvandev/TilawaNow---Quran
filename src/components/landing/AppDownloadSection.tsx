import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

import { useState } from "react";
import { usePWA } from "@/contexts/PWAContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Share, PlusSquare, ArrowUpCircle } from "lucide-react";

export const AppDownloadSection = () => {
    const { install, isInstallable, isInstalled } = usePWA();
    const [showInstructions, setShowInstructions] = useState(false);

    const handleInstallClick = () => {
        if (isInstallable) {
            install();
        } else if (!isInstalled) {
            setShowInstructions(true);
        }
    };

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
                            Experience the best of TilawaNow on your device. Enjoy reading,
                            background audio, and a focused spiritual journey wherever you go.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                            <Button
                                size="lg"
                                className="h-14 px-8 text-lg gap-3 rounded-full shadow-lg hover:shadow-primary/25 transition-all"
                                onClick={handleInstallClick}
                                disabled={isInstalled}
                            >
                                <Download className="w-6 h-6" />
                                {isInstalled ? "App Installed" : "Download App"}
                            </Button>
                        </div>

                        {/* Installation Instructions Dialog */}
                        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                            <DialogContent className="max-w-md bg-card border-border shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">How to Install</DialogTitle>
                                    <DialogDescription className="text-muted-foreground text-lg mt-2">
                                        If the download doesn't start automatically, follow these steps to add TilawaNow to your home screen:
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                                        <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                            <Share className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">1. Tap Share</p>
                                            <p className="text-sm text-muted-foreground">Look for the share icon in your browser's menu or toolbar.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50">
                                        <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                            <PlusSquare className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">2. Add to Home Screen</p>
                                            <p className="text-sm text-muted-foreground">Scroll down and tap 'Add to Home Screen'.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                                        <div className="bg-primary/20 p-2 rounded-lg text-primary">
                                            <ArrowUpCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">3. TilawaNow Ready</p>
                                            <p className="text-sm text-muted-foreground">The app will now be available on your home screen for a premium experience.</p>
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={() => setShowInstructions(false)} className="w-full h-12 text-lg">
                                    Got it
                                </Button>
                            </DialogContent>
                        </Dialog>

                        <p className="mt-6 text-sm text-muted-foreground/60">
                            Available for install on iOS and Android via browser
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
};
