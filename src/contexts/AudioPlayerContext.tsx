import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Verse, Surah } from '@/lib/quran-api';

// --- Persisted State Shape ---
interface PersistedPlaybackState {
    surahId: number;
    surahData: Surah;
    verseKey: string;
    currentIndex: number;
    currentTime: number;
    wasPlaying: boolean;
    playbackRate: number;
    loopMode: 'NONE' | 'SURAH' | 'AYAH';
    timestamp: number;
}

const STORAGE_KEY = 'tilawa_playback_state';
const PERSIST_THROTTLE_MS = 1000;
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AudioPlayerContextType {
    isPlaying: boolean;
    currentVerseKey: string | null;
    currentSurah: Surah | null;
    currentVerse: Verse | null;
    currentWordPosition: number;
    isLoading: boolean;
    currentTime: number;
    duration: number;
    playlist: Verse[];
    currentIndex: number;
    isPlayerVisible: boolean;
    isFullPlayerOpen: boolean;
    setFullPlayerOpen: (open: boolean) => void;
    playSurah: (surah: Surah, verses: Verse[], startVerseKey?: string) => void;
    playVerse: (verse: Verse, surah: Surah) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrev: () => void;
    closePlayer: () => void;
    seek: (time: number) => void;
    setOnPlaylistEnd: (callback: () => void) => void;
    playbackRate: number;
    setPlaybackRate: (rate: number) => void;
    loopMode: 'NONE' | 'SURAH' | 'AYAH';
    setLoopMode: (mode: 'NONE' | 'SURAH' | 'AYAH') => void;
    jumpToIndex: (index: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
    }
    return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentVerseKey, setCurrentVerseKey] = useState<string | null>(null);
    const [currentSurah, setCurrentSurah] = useState<Surah | null>(null);
    const [currentWordPosition, setCurrentWordPosition] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullPlayerOpen, setFullPlayerOpen] = useState(false);

    const [playlist, setPlaylist] = useState<Verse[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isContinuous, setIsContinuous] = useState(false);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const [loopMode, setLoopMode] = useState<'NONE' | 'SURAH' | 'AYAH'>('NONE');

    // Dual-Buffer Audio Strategy for Industry-Level Gapless Playback
    const primaryAudio = useRef<HTMLAudioElement | null>(null);
    const secondaryAudio = useRef<HTMLAudioElement | null>(null);
    const activeBuffer = useRef<'PRIMARY' | 'SECONDARY'>('PRIMARY');
    const isTransitioning = useRef(false); // Guard to prevent double-transitions
    const transitionRef = useRef<string | null>(null); // Tracks which verse just triggered a transition
    const rafRef = useRef<number | null>(null);
    const lastTimeUpdateRef = useRef(0); // Throttle time state updates
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tabIdRef = useRef(`tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const broadcastRef = useRef<BroadcastChannel | null>(null);
    const restoredRef = useRef(false);

    // Derived state
    const currentVerse = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
    const isPlayerVisible = currentVerseKey !== null && currentSurah !== null;

    useEffect(() => {
        primaryAudio.current = new Audio();
        secondaryAudio.current = new Audio();
        
        // Ensure high-quality audio pre-loading
        [primaryAudio.current, secondaryAudio.current].forEach(audio => {
            if (audio) {
                audio.preload = "auto";
                audio.volume = 1.0;
            }
        });
        
        return () => {
            primaryAudio.current?.pause();
            secondaryAudio.current?.pause();
            primaryAudio.current = null;
            secondaryAudio.current = null;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const getActiveAudio = () => activeBuffer.current === 'PRIMARY' ? primaryAudio.current : secondaryAudio.current;
    const getInactiveAudio = () => activeBuffer.current === 'PRIMARY' ? secondaryAudio.current : primaryAudio.current;

    // --- Playback Rate Setter (also updates active audio) ---
    const setPlaybackRate = useCallback((rate: number) => {
        setPlaybackRateState(rate);
        const audio = getActiveAudio();
        if (audio) audio.playbackRate = rate;
    }, []);

    // --- localStorage Persistence (throttled) ---
    const persistState = useCallback(() => {
        if (persistTimerRef.current) return; // Already scheduled
        persistTimerRef.current = setTimeout(() => {
            persistTimerRef.current = null;
            try {
                const audio = getActiveAudio();
                const state: PersistedPlaybackState = {
                    surahId: currentSurah?.id || 0,
                    surahData: currentSurah!,
                    verseKey: currentVerseKey || '',
                    currentIndex,
                    currentTime: audio?.currentTime || 0,
                    wasPlaying: isPlaying,
                    playbackRate: playbackRate,
                    loopMode,
                    timestamp: Date.now(),
                };
                if (state.surahId && state.verseKey) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                }
            } catch { /* localStorage full or unavailable */ }
        }, PERSIST_THROTTLE_MS);
    }, [currentSurah, currentVerseKey, currentIndex, isPlaying, playbackRate, loopMode]);

    // Persist on meaningful state changes
    useEffect(() => {
        if (currentVerseKey && currentSurah) {
            persistState();
        }
    }, [currentVerseKey, currentSurah, isPlaying, currentIndex, loopMode, playbackRate, persistState]);

    // --- BroadcastChannel Cross-Tab Sync ---
    useEffect(() => {
        try {
            broadcastRef.current = new BroadcastChannel('tilawa_audio_sync');
            broadcastRef.current.onmessage = (event) => {
                const { type, payload, tabId } = event.data;
                if (tabId === tabIdRef.current) return; // Ignore own messages

                switch (type) {
                    case 'PLAY':
                        // Another tab started playing, pause this one
                        const audio = getActiveAudio();
                        if (audio && !audio.paused) {
                            audio.pause();
                            setIsPlaying(false);
                        }
                        break;
                    case 'TRACK_CHANGE':
                        // Update display info from the active tab
                        if (payload.surah) setCurrentSurah(payload.surah);
                        if (payload.verseKey) setCurrentVerseKey(payload.verseKey);
                        break;
                    case 'CLOSE':
                        setIsPlaying(false);
                        setCurrentVerseKey(null);
                        setCurrentSurah(null);
                        setPlaylist([]);
                        break;
                }
            };
        } catch { /* BroadcastChannel not supported */ }
        return () => broadcastRef.current?.close();
    }, []);

    const broadcast = useCallback((type: string, payload: any = {}) => {
        try {
            broadcastRef.current?.postMessage({ type, payload, tabId: tabIdRef.current });
        } catch { /* ignore */ }
    }, []);

    // --- Media Session API ---
    useEffect(() => {
        if (!('mediaSession' in navigator) || !currentVerse || !currentSurah) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `Ayah ${currentVerseKey?.split(':')[1] || ''}`,
                artist: currentSurah.name_simple,
                album: 'TilawaNow — Quran',
                artwork: [
                    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        } catch { /* Media Session not supported */ }
    }, [currentVerseKey, currentSurah, currentVerse, isPlaying]);

    // --- Seek ---
    const seek = useCallback((time: number) => {
        const audio = getActiveAudio();
        if (audio && isFinite(time)) {
            audio.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const prefetchNext = useCallback((nextIndex: number) => {
        const nextVerse = playlist[nextIndex];
        const nextAudio = getInactiveAudio();
        if (nextVerse?.audio?.url && nextAudio) {
            const url = nextVerse.audio.url;
            const fullUrl = url.startsWith('http') ? url : `https://verses.quran.com/${url}`;
            // Only set if different to avoid reloading already buffered audio
            if (nextAudio.src !== fullUrl) {
                nextAudio.src = fullUrl;
                nextAudio.load();
            }
        }
    }, [playlist]);

    const playWithBuffer = useCallback(async (verse: Verse, seekToTime?: number) => {
        const audio = getActiveAudio();
        if (!audio) return;

        const url = verse.audio?.url;
        if (!url) return;

        const fullUrl = url.startsWith('http') ? url : `https://verses.quran.com/${url}`;
        
        // Pause any currently playing audio on the OTHER buffer to prevent play() AbortError
        const otherAudio = getInactiveAudio();
        if (otherAudio && !otherAudio.paused) {
            otherAudio.pause();
        }

        // If the URL is already loaded in the active buffer (due to pre-loading), we just play it
        if (audio.src !== fullUrl) {
            audio.src = fullUrl;
            audio.load();
        }

        setCurrentVerseKey(verse.verse_key);
        setCurrentWordPosition(-1);
        
        audio.playbackRate = playbackRate;

        // If seeking to a specific time, wait for metadata to be loaded
        if (seekToTime && seekToTime > 0) {
            const onCanPlay = () => {
                audio.currentTime = seekToTime;
                audio.removeEventListener('canplay', onCanPlay);
            };
            if (audio.readyState >= 3) {
                audio.currentTime = seekToTime;
            } else {
                audio.addEventListener('canplay', onCanPlay);
            }
        }

        try {
            await audio.play();
            setIsPlaying(true);
            setIsLoading(false);
            broadcast('PLAY', { surah: currentSurah, verseKey: verse.verse_key });
        } catch (err: any) {
            // AbortError is expected during gapless transitions — silently ignore
            if (err?.name !== 'AbortError') {
                console.error("Playback failed", err);
            }
        }

        // Proactive Pre-load Next after starting current
        const nextIdx = playlist.findIndex(v => v.verse_key === verse.verse_key) + 1;
        if (nextIdx < playlist.length) {
            prefetchNext(nextIdx);
        }
    }, [playbackRate, playlist, prefetchNext, broadcast, currentSurah]);

    const playNext = useCallback((isProactive = false) => {
        if (isTransitioning.current) return;
        isTransitioning.current = true;

        let nextIndex = -1;
        if (currentIndex + 1 < playlist.length) {
            nextIndex = currentIndex + 1;
        } else if (loopMode === 'SURAH') {
            nextIndex = 0;
        }

        if (nextIndex !== -1) {
            // Swap buffers for gapless transition
            activeBuffer.current = activeBuffer.current === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
            setCurrentIndex(nextIndex);
            playWithBuffer(playlist[nextIndex]);
            broadcast('TRACK_CHANGE', { surah: currentSurah, verseKey: playlist[nextIndex].verse_key });
            
            // Allow transitions again after 100ms
            setTimeout(() => { isTransitioning.current = false; }, 100);
        } else if (!isProactive) { // Only stop if it's the real end
            setIsPlaying(false);
            onPlaylistEndRef.current?.();
            isTransitioning.current = false;
        }
    }, [currentIndex, playlist, loopMode, playWithBuffer, broadcast, currentSurah]);

    // High-Precision Industry-Level Continuous Audio Monitoring
    useEffect(() => {
        const monitorPlayback = () => {
            const audio = getActiveAudio();
            if (!audio || audio.paused || !isPlaying) {
                rafRef.current = requestAnimationFrame(monitorPlayback);
                return;
            }

            const verse = playlist[currentIndex];
            if (!verse) {
                rafRef.current = requestAnimationFrame(monitorPlayback);
                return;
            }

            // 1. High-Performance Word Highlighting (Sync with RAF)
            const currentTimeMs = Math.floor(audio.currentTime * 1000);
            const segments = verse.audio?.segments;
            
            if (segments && segments.length > 0) {
                // Find the word that contains the current playback timestamp
                // Quran.com API Format: [index, word_position, start_ms, end_ms]
                const activeSegment = segments.find(seg => 
                    currentTimeMs >= seg[2] && currentTimeMs <= seg[3]
                );

                if (activeSegment) {
                    if (currentWordPosition !== activeSegment[1]) {
                        setCurrentWordPosition(activeSegment[1]);
                    }
                } else {
                    // If we are between segments or at the very end of the ayah
                    // but before the proactive transition triggers
                    if (currentWordPosition !== -1) {
                        // Check if we passed the last word
                        const lastSegment = segments[segments.length - 1];
                        if (currentTimeMs > lastSegment[3]) {
                            setCurrentWordPosition(-1);
                        }
                    }
                }
            } else if (currentWordPosition !== -1) {
                // No segments available for this verse, reset highlight
                setCurrentWordPosition(-1);
            }

            // 2. Throttled Time/Duration Updates (4 updates/sec max)
            const now = performance.now();
            if (now - lastTimeUpdateRef.current > 250) {
                lastTimeUpdateRef.current = now;
                setCurrentTime(audio.currentTime);
                if (audio.duration && isFinite(audio.duration)) {
                    setDuration(audio.duration);
                }
            }



            rafRef.current = requestAnimationFrame(monitorPlayback);
        };

        rafRef.current = requestAnimationFrame(monitorPlayback);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [currentIndex, playlist, currentWordPosition, isPlaying, isContinuous, loopMode, playNext]);

    // Fallback handlers for browser events
    useEffect(() => {
        const audio = primaryAudio.current;
        const audio2 = secondaryAudio.current;
        if (!audio || !audio2) return;

        const handleEnded = (e: Event) => {
            const endedPlayer = e.target as HTMLAudioElement;
            const currentAudio = getActiveAudio();
            
            // Only handle 'ended' if we haven't already transitioned proactively
            // or if we are in 'AYAH' loop mode (where proactive is disabled)
            if (endedPlayer === currentAudio) {
                if (loopMode === 'AYAH') {
                    playWithBuffer(playlist[currentIndex]);
                } else if (isContinuous) {
                    // Slight delay to ensure hardware buffer finishes and add natural rhythmic gap
                    setTimeout(() => {
                        playNext();
                    }, 150);
                } else {
                    setIsPlaying(false);
                }
            }
        };

        audio.addEventListener('ended', handleEnded);
        audio2.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio2.removeEventListener('ended', handleEnded);
        };
    }, [currentIndex, playlist, loopMode, isContinuous, playWithBuffer]);

    // --- Media Session Action Handlers ---
    useEffect(() => {
        if (!('mediaSession' in navigator)) return;

        const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', () => { const a = getActiveAudio(); if (a) { a.play(); setIsPlaying(true); } }],
            ['pause', () => { const a = getActiveAudio(); if (a) { a.pause(); setIsPlaying(false); } }],
            ['nexttrack', () => playNext()],
            ['previoustrack', () => playPrev()],
            ['seekto', (details) => { if (details.seekTime != null) seek(details.seekTime); }],
        ];

        for (const [action, handler] of actionHandlers) {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
        }

        return () => {
            for (const [action] of actionHandlers) {
                try { navigator.mediaSession.setActionHandler(action, null); } catch { /* ignore */ }
            }
        };
    }, [playNext, seek]);

    // --- Restore Persisted State on Mount ---
    useEffect(() => {
        if (restoredRef.current) return;
        restoredRef.current = true;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const saved: PersistedPlaybackState = JSON.parse(raw);
            
            // Validate age
            if (Date.now() - saved.timestamp > STATE_MAX_AGE_MS) {
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            // Validate data
            if (!saved.surahId || !saved.verseKey || !saved.surahData) return;

            // Restore state (but don't auto-play — always resume paused)
            setCurrentSurah(saved.surahData);
            setCurrentVerseKey(saved.verseKey);
            setCurrentIndex(saved.currentIndex);
            setPlaybackRateState(saved.playbackRate || 1);
            setLoopMode(saved.loopMode || 'NONE');

            console.log(`[AudioEngine] Restored session: ${saved.surahData.name_simple} - Verse ${saved.verseKey}`);
        } catch {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const playSurah = (surah: Surah, verses: Verse[], startVerseKey?: string) => {
        setPlaylist(verses);
        setCurrentSurah(surah);
        setIsContinuous(true);
        const idx = startVerseKey ? verses.findIndex(v => v.verse_key === startVerseKey) : 0;
        const startIndex = idx === -1 ? 0 : idx;
        
        // Reset transition tracking for new surah
        transitionRef.current = null;
        setCurrentIndex(startIndex);
        
        // Clear secondary buffer to prevent legacy audio bleed
        const inactive = getInactiveAudio();
        if (inactive) { inactive.src = ""; inactive.load(); }
        
        playWithBuffer(verses[startIndex]);
        broadcast('TRACK_CHANGE', { surah, verseKey: verses[startIndex].verse_key });
    };

    const playVerse = (verse: Verse, surah: Surah) => {
        setPlaylist([verse]);
        setCurrentSurah(surah);
        setIsContinuous(false);
        setCurrentIndex(0);
        transitionRef.current = null;
        playWithBuffer(verse);
        broadcast('TRACK_CHANGE', { surah, verseKey: verse.verse_key });
    };

    const togglePlay = () => {
        const audio = getActiveAudio();
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play();
            setIsPlaying(true);
            broadcast('PLAY', { surah: currentSurah, verseKey: currentVerseKey });
        }
    };

    const onPlaylistEndRef = useRef<(() => void) | null>(null);
    const setOnPlaylistEnd = (cb: () => void) => { onPlaylistEndRef.current = cb; };

    const playPrev = useCallback(() => {
        if (currentIndex - 1 >= 0) {
            const nextIdx = currentIndex - 1;
            transitionRef.current = null; // Allow re-transitioning
            setCurrentIndex(nextIdx);
            playWithBuffer(playlist[nextIdx]);
            broadcast('TRACK_CHANGE', { surah: currentSurah, verseKey: playlist[nextIdx].verse_key });
        }
    }, [currentIndex, playlist, playWithBuffer, broadcast, currentSurah]);

    const jumpToIndex = useCallback((index: number) => {
        if (index >= 0 && index < playlist.length) {
            transitionRef.current = null;
            setCurrentIndex(index);
            playWithBuffer(playlist[index]);
            broadcast('TRACK_CHANGE', { surah: currentSurah, verseKey: playlist[index].verse_key });
        }
    }, [playlist, playWithBuffer, broadcast, currentSurah]);

    const closePlayer = () => {
        primaryAudio.current?.pause();
        secondaryAudio.current?.pause();
        setIsPlaying(false);
        setCurrentVerseKey(null);
        setCurrentSurah(null);
        setPlaylist([]);
        setCurrentTime(0);
        setDuration(0);
        setFullPlayerOpen(false);
        transitionRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        localStorage.removeItem(STORAGE_KEY);
        broadcast('CLOSE');
    };

    return (
        <AudioPlayerContext.Provider value={{
            isPlaying, currentVerseKey, currentSurah, currentVerse, currentWordPosition, isLoading,
            currentTime, duration, playlist, currentIndex,
            isPlayerVisible, isFullPlayerOpen, setFullPlayerOpen,
            playSurah, playVerse, togglePlay, playNext, playPrev, closePlayer, seek, jumpToIndex,
            setOnPlaylistEnd, playbackRate, setPlaybackRate, loopMode, setLoopMode
        }}>
            {children}
        </AudioPlayerContext.Provider>
    );
};
