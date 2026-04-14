"use client";

import { useCallback, useRef, useState, useEffect } from 'react';

// Extend window for Pip API types
declare global {
    interface Window {
        documentPictureInPicture: {
            requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
            window: Window | null;
        };
    }
}

export const usePipPlayer = () => {
    const [isPipActive, setIsPipActive] = useState(false);
    const pipWindowRef = useRef<Window | null>(null);

    const closePip = useCallback(() => {
        if (pipWindowRef.current) {
            pipWindowRef.current.close();
            pipWindowRef.current = null;
            setIsPipActive(false);
        }
    }, []);

    const openPip = useCallback(async () => {
        if (!('documentPictureInPicture' in window)) {
            alert("Picture-in-Picture is not supported in this browser. Please use Chrome or Edge 111+.");
            return;
        }

        try {
            // If already open, just focus it
            if (pipWindowRef.current) {
                pipWindowRef.current.focus();
                return;
            }

            const pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 360,
                height: 480,
            });

            // 1. Copy Styles
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    if (styleSheet.href) {
                        const link = pipWindow.document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        pipWindow.document.head.appendChild(link);
                    } else {
                        const style = pipWindow.document.createElement('style');
                        const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                        style.textContent = cssRules;
                        pipWindow.document.head.appendChild(style);
                    }
                } catch (e) {
                    console.warn("Could not copy some styles to PiP window:", e);
                }
            });

            // 2. Setup Container for React Portal
            const container = pipWindow.document.createElement('div');
            container.id = 'pip-player-root';
            pipWindow.document.body.append(container);

            // 3. Handle Closure
            pipWindow.addEventListener('pagehide', () => {
                setIsPipActive(false);
                pipWindowRef.current = null;
            });

            pipWindowRef.current = pipWindow;
            setIsPipActive(true);
        } catch (error) {
            console.error("Failed to open PiP window:", error);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => closePip();
    }, [closePip]);

    return {
        isPipActive,
        openPip,
        closePip,
    };
};
