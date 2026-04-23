import React, { createContext, useContext, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAContextType {
    isInstallable: boolean;
    isInstalled: boolean;
    install: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already in standalone mode or previously marked as installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone === true;
        
        const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
        
        setIsInstalled(isStandalone || wasInstalled);

        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            
            // If the browser fires the install prompt, it's definitely not installed
            setIsInstalled(false);
            localStorage.removeItem('pwa-installed');
            
            console.log('PWA install prompt captured');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Optionally listen for appinstalled event to hide button
        const installHandler = () => {
            setIsInstallable(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
            localStorage.setItem('pwa-installed', 'true');
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
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsInstallable(false);
            setIsInstalled(true);
            localStorage.setItem('pwa-installed', 'true');
        }
    };

    return (
        <PWAContext.Provider value={{ isInstallable, isInstalled, install }}>
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
