// Use a safe import strategy for Puter.js which is browser-only
let puterInstance: any = null;

if (typeof window !== "undefined") {
    // Only import on the client
    import('@heyputer/puter.js').then(module => {
        puterInstance = module.default;
    });
}

/**
 * Ensures the Puter SDK is initialized and available.
 * In a Next.js environment, this should only be called on the client.
 */
export const getPuter = () => {
    if (typeof window === "undefined") return null;
    return puterInstance;
};

/**
 * Helper to check if the SDK has loaded.
 */
export const isPuterLoaded = () => {
    return puterInstance !== null;
};

/**
 * Helper to ensure the user is signed in to Puter.
 */
export const isPuterSignedIn = () => {
    if (typeof window === "undefined" || !puterInstance) return false;
    return puterInstance.auth.isSignedIn();
};

export default getPuter;
