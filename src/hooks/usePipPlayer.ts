"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

const PIP_WIDTH = 380;
const PIP_HEIGHT = 220;

// Formats seconds -> M:SS
function fmt(s: number): string {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function usePipPlayer() {
    const pipWindowRef = useRef<DocumentPictureInPictureWindow | null>(null);
    const rafRef = useRef<number | null>(null);
    const isOpenRef = useRef(false);

    const {
        isPlaying,
        isLoading,
        currentSurah,
        currentVerseKey,
        currentVerse,
        currentWordPosition,
        currentTime,
        duration,
        loopMode,
        playbackRate,
        togglePlay,
        playNext,
        playPrev,
        closePlayer,
        seek,
    } = useAudioPlayer();

    // Use refs to avoid stale closures in PiP event listeners
    const togglePlayRef = useRef(togglePlay);
    const playNextRef = useRef(playNext);
    const playPrevRef = useRef(playPrev);
    const seekRef = useRef(seek);
    const durationRef = useRef(duration);

    useEffect(() => {
        togglePlayRef.current = togglePlay;
        playNextRef.current = playNext;
        playPrevRef.current = playPrev;
        seekRef.current = seek;
        durationRef.current = duration;
    }, [togglePlay, playNext, playPrev, seek, duration]);

    // Inject self-contained CSS into the PiP window document
    const injectStyles = useCallback((doc: Document) => {
        // Copy all stylesheets from the main page
        Array.from(document.styleSheets).forEach((sheet) => {
            try {
                if (sheet.href) {
                    // External stylesheet — add a link tag
                    const link = doc.createElement("link");
                    link.rel = "stylesheet";
                    link.href = sheet.href;
                    doc.head.appendChild(link);
                } else {
                    // Inline stylesheet — copy rules
                    const rules = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
                    const style = doc.createElement("style");
                    style.textContent = rules;
                    doc.head.appendChild(style);
                }
            } catch {
                // Cross-origin sheets — skip safely
            }
        });

        // Force dark mode and reset body
        const baseStyle = doc.createElement("style");
        baseStyle.textContent = `
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
            body {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                color: #f1f5f9;
                background: transparent;
            }
            :root {
                --primary: 210 35% 55%;
                --primary-foreground: 0 0% 100%;
                color-scheme: dark;
            }
            .pip-root {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                background: rgba(10, 12, 18, 0.97);
                border-radius: 14px;
                overflow: hidden;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.07);
                box-shadow: 0 24px 64px rgba(0,0,0,0.6);
            }
            .pip-top { padding: 12px 16px 4px; flex-shrink: 0; }
            .pip-meta { display: flex; align-items: baseline; justify-content: center; gap: 8px; text-align: left; }
            .pip-icon {
                font-size: 18px; font-weight: 800;
                color: hsl(210 35% 55%);
                opacity: 0.6;
                font-family: 'Inter', system-ui, sans-serif;
                flex-shrink: 0;
            }
            .pip-titles { flex: 0 1 auto; min-width: 0; }
            .pip-surah { font-size: 14px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
            .pip-verse { font-size: 10px; color: #94a3b8; font-weight: 500; margin-top: -1px; }
            .pip-arabic {
                flex: 1; padding: 8px 20px;
                direction: rtl; text-align: center;
                font-size: 24px; line-height: 1.45;
                color: #e2e8f0;
                overflow-y: auto;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            .pip-word {
                display: inline-block;
                padding: 0 4px;
                border-radius: 4px;
                transition: all 0.2s ease;
            }
            .pip-word-highlight {
                color: #ffffff;
                background: hsla(210, 35%, 55%, 0.2);
                text-shadow: 0 0 8px rgba(100, 140, 180, 0.4);
                transform: scale(1.1);
                position: relative;
                z-index: 1;
            }
            .pip-progress-wrap { padding: 0 16px 4px; }
            .pip-track {
                width: 100%; height: 3px; border-radius: 99px;
                background: rgba(255,255,255,0.1); cursor: pointer; position: relative;
                transition: height 0.15s;
            }
            .pip-track:hover { height: 5px; }
            .pip-fill {
                height: 100%; border-radius: 99px;
                background: hsl(210 35% 55%);
                pointer-events: none;
                box-shadow: 0 0 12px rgba(100, 140, 180, 0.5);
            }
            .pip-times { display: flex; justify-content: space-between; margin-top: 3px; }
            .pip-times span { font-size: 10px; color: #475569; font-variant-numeric: tabular-nums; }
            .pip-controls {
                padding: 6px 16px 14px;
                display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .pip-btn {
                width: 36px; height: 36px; border-radius: 50%;
                background: transparent; border: none; cursor: pointer;
                color: #94a3b8; display: flex; align-items: center; justify-content: center;
                transition: color 0.15s, background 0.15s, transform 0.1s;
            }
            .pip-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
            .pip-btn:active { transform: scale(0.9); }
            .pip-btn-play {
                width: 52px; height: 52px;
                background: hsl(210 35% 55%);
                color: #ffffff;
                box-shadow: 0 8px 24px rgba(100, 140, 180, 0.4);
            }
            .pip-btn-play:hover { background: hsl(210 35% 62%); color: #ffffff; transform: scale(1.05); }
            .pip-btn-play:active { transform: scale(0.95); }
            .pip-spinner {
                width: 20px; height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: #ffffff;
                border-radius: 50%;
                animation: pip-spin 0.8s linear infinite;
            }
            @keyframes pip-spin { to { transform: rotate(360deg); } }
            svg { display: block; }
        `;
        doc.head.appendChild(baseStyle);
    }, []);

    // Build the full HTML structure of the PiP player
    const buildDOM = useCallback((doc: Document) => {
        const root = doc.createElement("div");
        root.className = "pip-root";
        root.innerHTML = `
            <div class="pip-top">
                <div class="pip-meta">
                    <div class="pip-icon" id="pip-surah-id">—</div>
                    <div class="pip-titles">
                        <div class="pip-surah" id="pip-surah-name">Loading...</div>
                        <div class="pip-verse" id="pip-verse-num">—</div>
                    </div>
                </div>
            </div>
            <div class="pip-arabic" id="pip-arabic"></div>
            <div class="pip-progress-wrap">
                <div class="pip-track" id="pip-track">
                    <div class="pip-fill" id="pip-fill" style="width:0%"></div>
                </div>
                <div class="pip-times">
                    <span id="pip-time-cur">0:00</span>
                    <span id="pip-time-dur">0:00</span>
                </div>
            </div>
            <div class="pip-controls">
                <button class="pip-btn" id="pip-prev-btn" title="Previous ayah">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
                    </svg>
                </button>
                <button class="pip-btn pip-btn-play" id="pip-play-btn" title="Play / Pause">
                    <svg id="pip-icon-play" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <svg id="pip-icon-pause" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:none">
                        <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    <div class="pip-spinner" id="pip-spinner" style="display:none"></div>
                </button>
                <button class="pip-btn" id="pip-next-btn" title="Next ayah">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
                    </svg>
                </button>
            </div>
        `;
        doc.body.appendChild(root);
    }, []);

    // Wire event listeners to controls
    const wireEvents = useCallback((doc: Document) => {
        doc.getElementById("pip-play-btn")?.addEventListener("click", () => togglePlayRef.current());
        doc.getElementById("pip-next-btn")?.addEventListener("click", () => playNextRef.current());
        doc.getElementById("pip-prev-btn")?.addEventListener("click", () => playPrevRef.current());

        // Seekable progress bar
        const track = doc.getElementById("pip-track");
        if (track) {
            track.addEventListener("click", (e) => {
                const rect = track.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                if (durationRef.current > 0) seekRef.current(ratio * durationRef.current);
            });
        }
    }, []);

    // Live update loop — syncs state from the React context to the PiP DOM
    const startUpdateLoop = useCallback((doc: Document) => {
        const tick = () => {
            if (!isOpenRef.current) return;

            const surahId = doc.getElementById("pip-surah-id");
            const surahName = doc.getElementById("pip-surah-name");
            const verseNum = doc.getElementById("pip-verse-num");
            const arabicEl = doc.getElementById("pip-arabic");
            const fill = doc.getElementById("pip-fill");
            const timeCur = doc.getElementById("pip-time-cur");
            const timeDur = doc.getElementById("pip-time-dur");
            const iconPlay = doc.getElementById("pip-icon-play") as HTMLElement | null;
            const iconPause = doc.getElementById("pip-icon-pause") as HTMLElement | null;
            const spinner = doc.getElementById("pip-spinner") as HTMLElement | null;

            // These are closures over React state — they read the latest values
            // because we cancel & restart the loop on context changes.
            if (surahId) surahId.textContent = currentSurah?.id?.toString() ?? "—";
            if (surahName) surahName.textContent = currentSurah?.name_simple ?? "—";
            if (verseNum) {
                const v = currentVerseKey?.split(":")?.[1];
                const t = currentSurah?.translated_name?.name ?? "";
                verseNum.textContent = v ? `Verse ${v} • ${t}` : "—";
            }
            if (arabicEl) {
                const words = currentVerse?.words?.filter(w => w.char_type_name !== "end") || [];
                const currentVerseKeyStr = currentVerseKey ?? "";

                // Only rebuild spans if the verse has changed
                if ((arabicEl as any)._lastVerseKey !== currentVerseKeyStr) {
                    (arabicEl as any)._lastVerseKey = currentVerseKeyStr;
                    arabicEl.innerHTML = "";

                    if (words.length > 0) {
                        words.forEach(w => {
                            const span = doc.createElement("span");
                            span.className = "pip-word";
                            span.id = `pip-word-${w.position}`;
                            span.textContent = w.text_uthmani ?? (w as any).text ?? "";
                            arabicEl.appendChild(span);
                            arabicEl.appendChild(doc.createTextNode(" "));
                        });
                    } else {
                        arabicEl.textContent = currentVerse?.text_uthmani ?? "";
                    }
                }

                // Update word highlights and auto-scroll
                if (words.length > 0) {
                    words.forEach(w => {
                        const span = doc.getElementById(`pip-word-${w.position}`);
                        if (span) {
                            if (w.position === currentWordPosition) {
                                span.classList.add("pip-word-highlight");
                                
                                // Auto-scroll to keep the highlighted word visible
                                if ((arabicEl as any)._lastHighlightedWord !== currentWordPosition) {
                                    (arabicEl as any)._lastHighlightedWord = currentWordPosition;
                                    span.scrollIntoView({ 
                                        behavior: 'smooth', 
                                        block: 'center',
                                        inline: 'nearest' 
                                    });
                                }
                            } else {
                                span.classList.remove("pip-word-highlight");
                            }
                        }
                    });
                }
            }
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            if (fill) fill.style.width = `${progress}%`;
            if (timeCur) timeCur.textContent = fmt(currentTime);
            if (timeDur) timeDur.textContent = fmt(duration);

            if (isLoading) {
                if (iconPlay) iconPlay.style.display = "none";
                if (iconPause) iconPause.style.display = "none";
                if (spinner) spinner.style.display = "block";
            } else if (isPlaying) {
                if (iconPlay) iconPlay.style.display = "none";
                if (iconPause) iconPause.style.display = "block";
                if (spinner) spinner.style.display = "none";
            } else {
                if (iconPlay) iconPlay.style.display = "block";
                if (iconPause) iconPause.style.display = "none";
                if (spinner) spinner.style.display = "none";
            }

            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [currentSurah, currentVerseKey, currentVerse, currentWordPosition, currentTime, duration, isPlaying, isLoading]);

    // Stop the RAF loop & close window
    const closePip = useCallback(() => {
        isOpenRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        try { pipWindowRef.current?.close(); } catch { /* already closed */ }
        pipWindowRef.current = null;
    }, []);

    // Open the PiP window
    const openPip = useCallback(async () => {
        if (!("documentPictureInPicture" in window)) {
            alert("Your browser does not support the Picture-in-Picture feature.\nPlease use Chrome or Edge 111+.");
            return;
        }

        // If already open, close and reopen to bring focus
        if (pipWindowRef.current) {
            closePip();
        }

        try {
            const pipWin = await window.documentPictureInPicture!.requestWindow({
                width: PIP_WIDTH,
                height: PIP_HEIGHT,
            });
            pipWindowRef.current = pipWin;
            isOpenRef.current = true;

            // Clone styles + build DOM
            injectStyles(pipWin.document);
            buildDOM(pipWin.document);
            wireEvents(pipWin.document);
            startUpdateLoop(pipWin.document);

            // When user closes the PiP window (via the browser's X button)
            pipWin.addEventListener("pagehide", () => {
                isOpenRef.current = false;
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                pipWindowRef.current = null;
            });
        } catch (err: any) {
            if (err?.name !== "NotAllowedError") {
                console.error("[PiP] Failed to open window:", err);
            }
        }
    }, [injectStyles, buildDOM, wireEvents, startUpdateLoop]);

    // When player state changes, restart the update loop so closures capture fresh values
    useEffect(() => {
        if (!isOpenRef.current || !pipWindowRef.current) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        startUpdateLoop(pipWindowRef.current.document);
    }, [currentSurah, currentVerseKey, currentVerse, currentWordPosition, currentTime, duration, isPlaying, isLoading, startUpdateLoop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            closePip();
        };
    }, [closePip]);

    const isPipOpen = isOpenRef.current;
    return { openPip, closePip, isPipOpen };
}
