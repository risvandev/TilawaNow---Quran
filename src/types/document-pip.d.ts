// Type declarations for the Document Picture-in-Picture API
// Supported in Chrome 111+ / Edge 111+
// https://wicg.github.io/document-picture-in-picture/

interface DocumentPictureInPictureOptions {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
    preferInitialWindowPlacement?: boolean;
}

interface DocumentPictureInPictureWindow extends EventTarget {
    readonly document: Document;
    width: number;
    height: number;
    close(): void;
    addEventListener(type: 'pagehide', listener: (ev: PageTransitionEvent) => void, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: 'pagehide', listener: (ev: PageTransitionEvent) => void, options?: boolean | EventListenerOptions): void;
}

interface DocumentPictureInPicture extends EventTarget {
    readonly window: DocumentPictureInPictureWindow | null;
    requestWindow(options?: DocumentPictureInPictureOptions): Promise<DocumentPictureInPictureWindow>;
}

interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
}
