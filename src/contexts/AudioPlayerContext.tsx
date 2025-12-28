import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Verse, Surah } from '@/lib/quran-api';

interface AudioPlayerContextType {
    isPlaying: boolean;
    currentVerseKey: string | null;
    currentSurah: Surah | null;
    currentWordPosition: number;
    isLoading: boolean;
    playSurah: (surah: Surah, verses: Verse[], startVerseKey?: string) => void;
    playVerse: (verse: Verse, surah: Surah) => void; // Play single verse then stop
    togglePlay: () => void;
    playNext: () => void;
    playPrev: () => void;
    closePlayer: () => void;
    setOnPlaylistEnd: (callback: () => void) => void;
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

    // Playlist State
    const [playlist, setPlaylist] = useState<Verse[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isContinuous, setIsContinuous] = useState(false);

    // Audio Element
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio element once
    useEffect(() => {
        audioRef.current = new Audio();

        // Cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const loadAndPlayVerse = useCallback(async (verse: Verse) => {
        if (!audioRef.current) return;

        // If verse has audio
        // Note: The API returns verse audio in a separate call usually, 
        // but we can assume we might have it or need to fetch it.
        // In ReadQuran we fetched a Map. Ideally, the playlist should contain the audio URL.
        // Since Verse type has 'audio' object potentially or we need to pass the URL.
        // For simplicity, let's assume we pass a modified Verse or look it up.
        // Wait, the API structure in the context needs to be robust. 
        // Let's assume we construct the URL: https://verses.quran.com/{url}
        // But we need the URL from the verse data. The Verse interface has `audio`?
        // Looking at `quran-api.ts`: Verse interface has `audio?: { url: string }`.

        let url = verse.audio?.url;
        // Fallback or external fetch if missing? 
        // For now, let's assume the passed Verse object has the audio URL populated 
        // OR we fetch it just-in-time if missing.
        // BUT, `fetchVerses` in `quran-api` returns `audio: { url }` ? 
        // Actually `fetchVerses` returns `Verse[]`. 
        // Let's check `quran-api.ts` again. yes `audio?: { url: string }`.

        if (!url) {
            // Silent fail or skip
            console.warn("No audio URL for verse", verse.verse_key);
            return;
        }

        const fullUrl = url.startsWith('http') ? url : `https://verses.quran.com/${url}`;

        // Don't set loading immediately to avoid flicker between verses
        // setIsLoading(true); 
        setCurrentVerseKey(verse.verse_key);
        setCurrentWordPosition(-1);

        audioRef.current.src = fullUrl;
        audioRef.current.load();

        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    setIsLoading(false);
                    setIsPlaying(true);
                })
                .catch(error => {
                    console.error("Playback failed:", error);
                    setIsLoading(false);
                });
        }
    }, []);

    // Events
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            // Do not set isPlaying(false) immediately if continuous, to keep UI smooth
            if (isContinuous) {
                playNext();
            } else {
                setIsPlaying(false);
            }
        };

        const handleTimeUpdate = () => {
            const verse = playlist[currentIndex];
            if (!verse?.audio?.segments || !audioRef.current) {
                // Only reset if it was set to something
                if (currentWordPosition !== -1) setCurrentWordPosition(-1);
                return;
            }

            const currentTimeMs = Math.floor(audioRef.current.currentTime * 1000);
            // segments: [wordIndex, start, end]
            // console.log("Time:", currentTimeMs, "Segments:", verse.audio.segments);
            if (verse.audio.segments && verse.audio.segments.length > 0 && Math.random() > 0.98) {
                console.log(`[Debug] Time: ${currentTimeMs}ms | Segs: ${verse.audio.segments.length} | First: ${verse.audio.segments[0]}`);
            }
            const activeSegment = verse.audio.segments.find((seg) =>
                currentTimeMs >= seg[1] && currentTimeMs <= seg[2]
            );

            if (activeSegment) {
                if (currentWordPosition !== activeSegment[0]) {
                    setCurrentWordPosition(activeSegment[0]);
                }
            } else {
                if (currentWordPosition !== -1) setCurrentWordPosition(-1);
            }
        };

        const handleWaiting = () => setIsLoading(true);
        const handlePlaying = () => {
            setIsLoading(false);
            setIsPlaying(true);
        };
        const handleCanPlay = () => setIsLoading(false);

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('playing', handlePlaying);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('playing', handlePlaying);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [isContinuous, currentIndex, playlist]); // Dependencies for playNext closure

    const playSurah = useCallback((surah: Surah, verses: Verse[], startVerseKey?: string) => {
        if (!verses.length) return;

        setPlaylist(verses);
        setCurrentSurah(surah);
        setIsContinuous(true);

        let startIndex = 0;
        if (startVerseKey) {
            startIndex = verses.findIndex(v => v.verse_key === startVerseKey);
            if (startIndex === -1) startIndex = 0;
        }

        setCurrentIndex(startIndex);
        loadAndPlayVerse(verses[startIndex]);
    }, [loadAndPlayVerse]);

    const playVerse = useCallback((verse: Verse, surah: Surah) => {
        // Play single, then stop
        setPlaylist([verse]);
        setCurrentSurah(surah);
        setIsContinuous(false);
        setCurrentIndex(0);
        loadAndPlayVerse(verse);
    }, [loadAndPlayVerse]);

    const togglePlay = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    }, [isPlaying]);

    // Callback for playlist end (used by Khatmah feature)
    const onPlaylistEndRef = useRef<(() => void) | null>(null);

    const setOnPlaylistEnd = useCallback((callback: () => void) => {
        onPlaylistEndRef.current = callback;
    }, []);

    const playNext = useCallback(() => {
        setCurrentIndex(prev => {
            if (prev + 1 < playlist.length) {
                const nextIndex = prev + 1;
                loadAndPlayVerse(playlist[nextIndex]);
                return nextIndex;
            } else {
                // End of list
                setIsPlaying(false);
                if (onPlaylistEndRef.current) {
                    onPlaylistEndRef.current();
                }
                return prev;
            }
        });
    }, [playlist, loadAndPlayVerse]);

    const playPrev = useCallback(() => {
        setCurrentIndex(prev => {
            if (prev - 1 >= 0) {
                const nextIndex = prev - 1;
                loadAndPlayVerse(playlist[nextIndex]);
                return nextIndex;
            }
            return prev;
        });
    }, [playlist, loadAndPlayVerse]);

    const closePlayer = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentVerseKey(null);
        setCurrentSurah(null);
        setPlaylist([]);
    }, []);

    return (
        <AudioPlayerContext.Provider
            value={{
                isPlaying,
                currentVerseKey,
                currentSurah,
                currentWordPosition,
                isLoading,
                playSurah,
                playVerse,
                togglePlay,
                playNext,
                playPrev,
                closePlayer,
                setOnPlaylistEnd
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    );
};
