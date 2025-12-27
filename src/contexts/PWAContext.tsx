import React, { createContext, useContext, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
    isInstallable: boolean;
    install: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            console.log('PWA install prompt captured');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Optionally listen for appinstalled event to hide button
        const installHandler = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        };
        window.addEventListener('appinstalled', installHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installHandler);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) {
            console.log('Installation prompt not available');
            return;
        }

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return (
        <PWAContext.Provider value={{ isInstallable, install }}>
            {children}
        </PWAContext.Provider>
    );
};

export const usePWA = () => {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
};
