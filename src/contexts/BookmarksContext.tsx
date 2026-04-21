import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Bookmark {
    id: string;
    surah_id: number;
    verse_key: string;
    created_at: string;
}

interface ReadingHistory {
    surah_id: number;
    verse_key: string | null;
    last_read_at: string;
}

interface Mark {
    id: string;
    surah_id: number;
    ayah_id: number | null;
    type: 'ayah' | 'surah';
    created_at: string;
}

interface BookmarksContextType {
    bookmarks: Bookmark[];
    readingHistory: ReadingHistory[];
    marks: Mark[];
    userStats: { totalAyahsRead: number; uniqueAyahsRead: number; currentStreak: number; lastActiveDate: string | null; totalActiveDays: number };
    dailyActivity: { date: string, count: number }[];
    isLoading: boolean;
    addBookmark: (surahId: number, verseKey: string) => Promise<void>;
    removeBookmark: (verseKey: string) => Promise<void>;
    isBookmarked: (verseKey: string) => boolean;
    updateReadingHistory: (surahId: number, verseKey: string) => Promise<void>;
    toggleMark: (surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => Promise<void>;
    isMarked: (surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => boolean;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
    const [marks, setMarks] = useState<Mark[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Stats State
    const [userStats, setUserStats] = useState({
        totalAyahsRead: 0,
        uniqueAyahsRead: 0,
        currentStreak: 0,
        lastActiveDate: null as string | null,
        totalActiveDays: 0
    });

    // Activity Data for Chart
    const [dailyActivity, setDailyActivity] = useState<{ date: string, count: number }[]>([]);

    // Buffering system to minimize Supabase calls
    const BATCH_INTERVAL = 60000; // 60 seconds
    const pendingStatsRef = useRef({
        totalNewRead: 0,
        uniqueVerses: new Set<string>(),
        lastSurahId: null as number | null,
        lastVerseKey: null as string | null,
        hasChanges: false
    });

    // Fetch data on mount or user change
    useEffect(() => {
        if (user) {
            fetchUserData();
        } else {
            setBookmarks([]);
            setReadingHistory([]);
            setMarks([]);
            setDailyActivity([]);
            setUserStats({ totalAyahsRead: 0, uniqueAyahsRead: 0, currentStreak: 0, lastActiveDate: null, totalActiveDays: 0 });
        }
    }, [user]);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            // Fetch Bookmarks
            const { data: bookmarksData, error: bookmarksError } = await supabase
                .from('bookmarks')
                .select('*')
                .order('created_at', { ascending: false });

            if (bookmarksError) throw bookmarksError;
            setBookmarks(bookmarksData || []);

            // Fetch History
            const { data: historyData, error: historyError } = await supabase
                .from('reading_history')
                .select('surah_id, verse_key, last_read_at')
                .order('last_read_at', { ascending: false });

            if (historyError) throw historyError;
            setReadingHistory(historyData || []);

            // Fetch User Stats & Goal
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('total_ayahs_read, unique_ayahs_read, current_streak, last_active_date')
                .eq('id', user!.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error("Error fetching stats:", profileError);
            }

            if (profileData) {
                setUserStats({
                    totalAyahsRead: profileData.total_ayahs_read || 0,
                    uniqueAyahsRead: profileData.unique_ayahs_read || 0,
                    currentStreak: profileData.current_streak || 0,
                    lastActiveDate: profileData.last_active_date,
                    totalActiveDays: 0 // Will update below
                });
            }

            // Fetch Daily Activity (Last 7 Days) for Chart
            const { data: activityData, error: activityError } = await supabase
                .from('daily_activity')
                .select('date, ayahs_count')
                .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
                .order('date', { ascending: true });

            if (activityData) {
                setDailyActivity(activityData.map(d => ({ date: d.date, count: d.ayahs_count })));
            }

            // Fetch Total Active Days Count
            const { count: activeCount, error: countError } = await supabase
                .from('daily_activity')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user!.id);

            if (!countError && activeCount !== null) {
                setUserStats(prev => ({ ...prev, totalActiveDays: activeCount }));
            }

            // Fetch Marks
            const { data: marksData, error: marksError } = await supabase
                .from('marks')
                .select('*')
                .order('created_at', { ascending: false });

            if (marksError) throw marksError;
            setMarks(marksData || []);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const addBookmark = useCallback(async (surahId: number, verseKey: string) => {
        if (!user) {
            toast({ title: "Sign in required", description: "Please sign in to save bookmarks." });
            return;
        }

        // Optimistic update
        const tempId = Math.random().toString();
        const newBookmark: Bookmark = {
            id: tempId,
            surah_id: surahId,
            verse_key: verseKey,
            created_at: new Date().toISOString()
        };
        setBookmarks(prev => [newBookmark, ...prev]);

        try {
            const { data, error } = await supabase
                .from('bookmarks')
                .insert({ user_id: user.id, surah_id: surahId, verse_key: verseKey })
                .select()
                .single();

            if (error) throw error;

            // Replace temp with real
            setBookmarks(prev => prev.map(b => b.id === tempId ? data : b));

            toast({ title: "Bookmark saved", description: `Verse ${verseKey} added to bookmarks.` });
        } catch (error) {
            console.error('Error adding bookmark:', error);
            setBookmarks(prev => prev.filter(b => b.id !== tempId)); // Revert
            toast({ variant: "destructive", title: "Error", description: "Failed to save bookmark." });
        }
    }, [user, toast]);

    const removeBookmark = useCallback(async (verseKey: string) => {
        if (!user) return;

        setBookmarks(prev => {
            const previousBookmarks = [...prev];
            // We need to store previous state outside or trust the revert logic differently,
            // but here we just need stable function identity.
            return prev.filter(b => b.verse_key !== verseKey);
        });

        try {
            const { error } = await supabase
                .from('bookmarks')
                .delete()
                .eq('user_id', user.id)
                .eq('verse_key', verseKey);

            if (error) throw error;
            toast({ title: "Bookmark removed" });
        } catch (error) {
            console.error('Error removing bookmark:', error);
            // In a real app we'd revert state here, simplified for now or need refetch
            fetchUserData();
            toast({ variant: "destructive", title: "Error", description: "Failed to remove bookmark." });
        }
    }, [user, toast]);

    const isBookmarked = useCallback((verseKey: string) => {
        return bookmarks.some(b => b.verse_key === verseKey);
    }, [bookmarks]);

    const updateReadingHistory = useCallback(async (surahId: number, verseKey: string) => {
        if (!user) return;

        try {
            // 1. Update Detailed History
            const { error: historyError } = await supabase.from('reading_history').upsert(
                { user_id: user.id, surah_id: surahId, verse_key: verseKey, last_read_at: new Date().toISOString() },
                { onConflict: 'user_id, surah_id' }
            );

            if (historyError) throw historyError;

            // Update local history state
            setReadingHistory(prev => {
                const filtered = prev.filter(h => h.surah_id !== surahId);
                return [{ surah_id: surahId, verse_key: verseKey, last_read_at: new Date().toISOString() }, ...filtered];
            });

            // 2. Log Daily Activity
            const today = new Date().toISOString().split('T')[0];

            // We need functional update to access latest state without dependency
            // But for async logic relying on 'dailyActivity' state, we need it in dependency or use functional state setters everywhere
            // To keep useCallback stable, we shouldn't depend on changing state like 'dailyActivity' directly if we can avoid it.
            // However, we need to know existing count. 
            // Better strategy: fetch reliable count or trust local optimistic. 

            // Re-implementing lightly to be safe with dependencies:
            // We will do optimistic update inside setDailyActivity to avoid dependency on 'dailyActivity'

            let newCount = 1;
            setDailyActivity(prev => {
                const existingToday = prev.find(d => d.date === today);
                newCount = (existingToday?.count || 0) + 1;
                const others = prev.filter(d => d.date !== today);
                return [...others, { date: today, count: newCount }].sort((a, b) => a.date.localeCompare(b.date));
            });

            // DB Upsert for Activity
            // We use the newCount derived above, but strictly this is inside a callback. 
            // Since we can't easily extract the return value from setDailyActivity updater, we might drift.
            // BUT for the sake of stabilization:

            // For now, let's depend on user and rely on the fact that other state changes (bookmarks) won't break this.
            // Actually, we must include userStats in dependency if we use it.
            // Creating a robust stable function often requires refs for mutable state or reducers.
            // As a quick fix for the "unwanted loading", just wrapping in useCallback with state dependencies is enough 
            // as long as the state doesn't change *during* the initial render loop of the consumer.

            // However, 'userStats' changes on every read. So this function will still change on every read.
            // PROPER FIX:  The generic 'ReadingHistory' update shouldn't continuously destabilize the 'Context Value' 
            // if we can help it, OR the consumer (ReadQuran) shouldn't depend on it for 'useEffect' refetching.

            // But ReadQuran *does* depend on it.
            // If we use refs for state, we can keep the function stable!

        } catch (error) {
            console.error('Error updating history/stats:', error);
        }

        // Parallel: Update DB
        // We need to fetch current count to be accurate or valid logic... 
        // For this specific 'unwanted loading' bug, the issue is that 'ReadQuran' calls 'logVerseReading' which calls this.
        // If this changes identity, 'ReadQuran' re-runs effect.

        // Let's use the REF pattern for the state variables inside this callback to ensure it has STABLE identity.
    }, [user]); // We will fix the implementation below to use Refs/functional updates

    // To properly fix, we need to implement the function using functional updates only or Refs.
    // Let's try to just Memoize the value, but if updateReadingHistory changes, value changes.

    // START REPLACEMENT
    const userStatsRef = React.useRef(userStats);
    const dailyActivityRef = React.useRef(dailyActivity);

    useEffect(() => { userStatsRef.current = userStats; }, [userStats]);
    useEffect(() => { dailyActivityRef.current = dailyActivity; }, [dailyActivity]);

    // Robust Flush Logic: Syncs accumulated local progress to Supabase in a single batch
    const flushToSupabase = useCallback(async () => {
        const stats = pendingStatsRef.current;
        if (!user || !stats.hasChanges) return;

        // Reset buffer immediately to prevent overlapping flushes
        const totalToSync = stats.totalNewRead;
        const uniqueList = Array.from(stats.uniqueVerses);
        const lastSurah = stats.lastSurahId;
        const lastKey = stats.lastVerseKey;
        
        pendingStatsRef.current = {
            totalNewRead: 0,
            uniqueVerses: new Set<string>(),
            lastSurahId: null,
            lastVerseKey: null,
            hasChanges: false
        };

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Update Detailed History (Always Upsert latest for each surah)
            if (lastSurah && lastKey) {
                await supabase.from('reading_history').upsert(
                    { user_id: user.id, surah_id: lastSurah, verse_key: lastKey, last_read_at: new Date().toISOString() },
                    { onConflict: 'user_id, surah_id' }
                );
            }

            // 2. Track Unique Verses Read
            if (uniqueList.length > 0) {
                const upsertData = uniqueList.map(vKey => ({
                    user_id: user.id,
                    verse_key: vKey,
                    read_count: 1 // Default if new, won't easily increment on Conflict without RPC
                }));
                await supabase.from('verses_read').upsert(upsertData, { onConflict: 'user_id, verse_key' });
            }

            // 3. Update Daily Activity (Add the newly read count to the total for today)
            const { data: currentDay } = await supabase
                .from('daily_activity')
                .select('ayahs_count')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            const existingCount = currentDay?.ayahs_count || 0;
            await supabase.from('daily_activity').upsert({
                user_id: user.id,
                date: today,
                ayahs_count: existingCount + totalToSync
            }, { onConflict: 'user_id, date' });

            // 4. Update Main Profile Stats
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_ayahs_read, current_streak, last_active_date')
                .eq('id', user.id)
                .single();

            if (profile) {
                const lastActive = profile.last_active_date ? new Date(profile.last_active_date).toDateString() : null;
                const todayDate = new Date().toDateString();
                
                let newStreak = profile.current_streak || 0;
                if (lastActive !== todayDate) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    newStreak = (lastActive === yesterday.toDateString()) ? (newStreak + 1) : 1;
                }

                await supabase.from('profiles').update({
                    total_ayahs_read: (profile.total_ayahs_read || 0) + totalToSync,
                    current_streak: newStreak,
                    last_active_date: new Date().toISOString()
                }).eq('id', user.id);
            }
        } catch (error: any) {
            // Silence expected 401/403 or network errors to keep console clean
            const isAuthOrNetworkError =
              error?.status === 401 ||
              error?.status === 403 ||
              error?.code === "42501" ||
              error?.message?.includes("fetch") ||
              error?.message?.includes("CORS") ||
              error?.message?.includes("Unauthorized");

            if (!isAuthOrNetworkError) {
              console.error('Bookmarks: Critical Background Sync Error', error);
            }
        }
    }, [user]);

    // Periodic Background Sync
    useEffect(() => {
        const interval = setInterval(flushToSupabase, BATCH_INTERVAL);
        return () => {
            clearInterval(interval);
            // Final attempt to flush on unmount/close
            if (pendingStatsRef.current.hasChanges) flushToSupabase();
        };
    }, [flushToSupabase]);

    // Fast, Local-First progress tracking
    const updateReadingHistoryStable = useCallback(async (surahId: number, verseKey: string) => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];

        // --- PHASE 1: Instant Local UI Updates ---
        
        // 1. Update History List
        setReadingHistory(prev => {
            const filtered = prev.filter(h => h.surah_id !== surahId);
            return [{ surah_id: surahId, verse_key: verseKey, last_read_at: new Date().toISOString() }, ...filtered];
        });

        // 2. Update Stats (Optimistic Local Logic)
        setUserStats(prev => {
            const lastActive = prev.lastActiveDate ? new Date(prev.lastActiveDate).toDateString() : null;
            const todayDate = new Date().toDateString();
            let newStreak = prev.currentStreak;
            if (lastActive !== todayDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                newStreak = (lastActive === yesterday.toDateString()) ? (newStreak + 1) : 1;
            }

            return {
                ...prev,
                totalAyahsRead: prev.totalAyahsRead + 1,
                currentStreak: newStreak,
                lastActiveDate: new Date().toISOString(),
                totalActiveDays: (lastActive === todayDate) ? prev.totalActiveDays : (prev.totalActiveDays + 1)
            };
        });

        // 3. Update Chart Activity
        setDailyActivity(prev => {
            const existingToday = prev.find(d => d.date === today);
            const others = prev.filter(d => d.date !== today);
            return [...others, { date: today, count: (existingToday?.count || 0) + 1 }].sort((a, b) => a.date.localeCompare(b.date));
        });

        // --- PHASE 2: Silent Background Buffering ---
        pendingStatsRef.current.totalNewRead += 1;
        pendingStatsRef.current.uniqueVerses.add(verseKey);
        pendingStatsRef.current.lastSurahId = surahId;
        pendingStatsRef.current.lastVerseKey = verseKey;
        pendingStatsRef.current.hasChanges = true;

    }, [user]);

    const toggleMark = useCallback(async (surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => {
        if (!user) {
            toast({ title: "Sign in required", description: "Please sign in to mark items." });
            return;
        }

        const existingMark = marks.find(m => 
            m.surah_id === surahId && 
            m.ayah_id === ayahId && 
            m.type === type
        );

        if (existingMark) {
            // Remove mark (Optimistic)
            setMarks(prev => prev.filter(m => m.id !== existingMark.id));
            try {
                const { error } = await supabase
                    .from('marks')
                    .delete()
                    .eq('id', existingMark.id);
                if (error) throw error;
            } catch (error) {
                console.error('Error removing mark:', error);
                setMarks(prev => [...prev, existingMark]); // Revert
            }
        } else {
            // Add mark (Optimistic)
            
            // Check for exclusivity conflicts
            let markToReplace: Mark | undefined;
            if (type === 'surah') {
                // Exclusive Global Surah Mark
                markToReplace = marks.find(m => m.type === 'surah');
            } else if (type === 'ayah') {
                // Exclusive Ayah Mark Per Surah
                markToReplace = marks.find(m => m.type === 'ayah' && m.surah_id === surahId);
            }

            const tempId = Math.random().toString();
            const newMark: Mark = {
                id: tempId,
                surah_id: surahId,
                ayah_id: ayahId,
                type,
                created_at: new Date().toISOString()
            };

            // Update local state by removing collision and adding new
            setMarks(prev => {
                let filtered = prev;
                if (markToReplace) {
                    filtered = filtered.filter(m => m.id !== markToReplace!.id);
                }
                return [newMark, ...filtered];
            });

            try {
                // DB Cleanup for collisions (Aggressive - based on DB rules, not just state)
                if (type === 'surah') {
                    // One surah mark globally
                    await supabase.from('marks').delete().eq('user_id', user.id).eq('type', 'surah');
                } else if (type === 'ayah') {
                    // One ayah mark per surah
                    await supabase.from('marks').delete().eq('user_id', user.id).eq('type', 'ayah').eq('surah_id', surahId);
                }

                // DB Insert
                const { data, error } = await supabase
                    .from('marks')
                    .insert({ 
                        user_id: user.id, 
                        surah_id: surahId, 
                        ayah_id: ayahId, 
                        type 
                    })
                    .select()
                    .single();
                    
                if (error) {
                    console.error('Supabase Mark Insert Error:', error);
                    throw error;
                }
                
                // Replace temp with real
                setMarks(prev => prev.map(m => m.id === tempId ? data : m));
            } catch (error: any) {
                console.error('Final Mark Update Error:', error);
                fetchUserData(); // Re-sync with DB on failure
                toast({ 
                    variant: "destructive", 
                    title: "Error", 
                    description: error.message || "Failed to update marks." 
                });
            }
        }
    }, [user, marks, toast]);

    const isMarked = useCallback((surahId: number, ayahId: number | null, type: 'ayah' | 'surah') => {
        return marks.some(m => 
            m.surah_id === surahId && 
            m.ayah_id === ayahId && 
            m.type === type
        );
    }, [marks]);

    const value = React.useMemo(() => ({
        bookmarks,
        readingHistory,
        marks,
        userStats,
        dailyActivity,
        isLoading,
        addBookmark,
        removeBookmark,
        isBookmarked,
        updateReadingHistory: updateReadingHistoryStable,
        toggleMark,
        isMarked
    }), [bookmarks, readingHistory, marks, userStats, dailyActivity, isLoading, addBookmark, removeBookmark, isBookmarked, updateReadingHistoryStable, toggleMark, isMarked]);

    return (
        <BookmarksContext.Provider value={value}>
            {children}
        </BookmarksContext.Provider>
    );
};

export const useBookmarks = () => {
    const context = useContext(BookmarksContext);
    if (context === undefined) {
        throw new Error('useBookmarks must be used within a BookmarksProvider');
    }
    return context;
};
