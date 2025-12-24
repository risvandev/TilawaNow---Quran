import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

interface BookmarksContextType {
    bookmarks: Bookmark[];
    readingHistory: ReadingHistory[];
    userStats: { totalAyahsRead: number; uniqueAyahsRead: number; currentStreak: number; lastActiveDate: string | null; dailyGoal: number; weeklyGoal: number; totalActiveDays: number };
    dailyActivity: { date: string, count: number }[];
    isLoading: boolean;
    setDailyGoal: (goal: number) => Promise<void>;
    setWeeklyGoal: (goal: number) => Promise<void>;
    addBookmark: (surahId: number, verseKey: string) => Promise<void>;
    removeBookmark: (verseKey: string) => Promise<void>;
    isBookmarked: (verseKey: string) => boolean;
    updateReadingHistory: (surahId: number, verseKey: string) => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export const BookmarksProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Stats State
    const [userStats, setUserStats] = useState({
        totalAyahsRead: 0,
        uniqueAyahsRead: 0,
        currentStreak: 0,
        lastActiveDate: null as string | null,
        dailyGoal: 10,
        weeklyGoal: 70,
        totalActiveDays: 0
    });

    // Activity Data for Chart
    const [dailyActivity, setDailyActivity] = useState<{ date: string, count: number }[]>([]);

    // Fetch data on mount or user change
    useEffect(() => {
        if (user) {
            fetchUserData();
        } else {
            setBookmarks([]);
            setReadingHistory([]);
            setDailyActivity([]);
            setUserStats({ totalAyahsRead: 0, uniqueAyahsRead: 0, currentStreak: 0, lastActiveDate: null, dailyGoal: 10, weeklyGoal: 70, totalActiveDays: 0 });
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
                .select('total_ayahs_read, unique_ayahs_read, current_streak, last_active_date, daily_goal, weekly_goal')
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
                    dailyGoal: profileData.daily_goal || 10,
                    weeklyGoal: profileData.weekly_goal || 70,
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
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setDailyGoal = useCallback(async (goal: number) => {
        if (!user) return;
        setUserStats(prev => ({ ...prev, dailyGoal: goal }));
        try {
            await supabase.from('profiles').update({ daily_goal: goal }).eq('id', user.id);
            toast({ title: "Goal Updated", description: `Daily target set to ${goal} Ayahs.` });
        } catch (error) {
            console.error("Error setting goal:", error);
        }
    }, [user, toast]);

    const setWeeklyGoal = useCallback(async (goal: number) => {
        if (!user) return;
        setUserStats(prev => ({ ...prev, weeklyGoal: goal }));
        try {
            await supabase.from('profiles').update({ weekly_goal: goal }).eq('id', user.id);
            toast({ title: "Goal Updated", description: `Weekly target set to ${goal} Ayahs.` });
        } catch (error) {
            console.error("Error setting weekly goal:", error);
        }
    }, [user, toast]);

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

    const updateReadingHistoryStable = useCallback(async (surahId: number, verseKey: string) => {
        if (!user) return;

        try {
            // 1. Upsert Reading History (DB + Local)
            const { error: historyError } = await supabase.from('reading_history').upsert(
                { user_id: user.id, surah_id: surahId, verse_key: verseKey, last_read_at: new Date().toISOString() },
                { onConflict: 'user_id, surah_id' }
            );

            if (historyError) throw historyError;

            setReadingHistory(prev => {
                const filtered = prev.filter(h => h.surah_id !== surahId);
                return [{ surah_id: surahId, verse_key: verseKey, last_read_at: new Date().toISOString() }, ...filtered];
            });

            // 2. Track Unique Verses & Read Count
            try {
                // Attempt to insert into verses_read
                const { error: uniqueError } = await supabase.from('verses_read').insert({
                    user_id: user.id,
                    verse_key: verseKey,
                    read_count: 1
                });

                if (!uniqueError) {
                    // It was a new verse!
                    setUserStats(prev => ({
                        ...prev,
                        uniqueAyahsRead: (prev.uniqueAyahsRead || 0) + 1
                    }));
                } else if (uniqueError.code === '23505') { // Unique violation
                    // Verse exists, increment read_count
                    try {
                        const { error: rpcError } = await supabase.rpc('increment_verse_read_count', {
                            p_user_id: user.id,
                            p_verse_key: verseKey
                        });
                        if (rpcError) throw rpcError;
                    } catch (err) {
                        // Fallback: Fetch and Update manually
                        const { data } = await supabase
                            .from('verses_read')
                            .select('read_count')
                            .eq('user_id', user.id)
                            .eq('verse_key', verseKey)
                            .single();

                        if (data) {
                            await supabase
                                .from('verses_read')
                                .update({ read_count: (data.read_count || 1) + 1 })
                                .eq('user_id', user.id)
                                .eq('verse_key', verseKey);
                        }
                    }
                }
            } catch (ignore) {
                // Ignore other errors
            }


            // 3. Calculate New Stats using Refs (Current State)
            const today = new Date().toISOString().split('T')[0];

            // --- Activity Calculation ---
            const currentActivity = dailyActivityRef.current;
            const existingToday = currentActivity.find(d => d.date === today);
            // Increment count safely
            const newDailyCount = (existingToday?.count || 0) + 1;

            // Optimistic Activity Update
            setDailyActivity(prev => {
                const others = prev.filter(d => d.date !== today);
                return [...others, { date: today, count: newDailyCount }].sort((a, b) => a.date.localeCompare(b.date));
            });

            // DB Activity Update (Fire & Forget)
            supabase.from('daily_activity').upsert({
                user_id: user.id,
                date: today,
                ayahs_count: newDailyCount
            }, { onConflict: 'user_id, date' }).then(res => {
                if (res.error) console.error("Error updating daily activity:", res.error);
            });

            // --- User Stats Calculation ---
            const currentStats = userStatsRef.current;
            const lastActive = currentStats.lastActiveDate ? new Date(currentStats.lastActiveDate).toDateString() : null;
            const todayDate = new Date().toDateString();

            let newStreak = currentStats.currentStreak;
            if (lastActive !== todayDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastActive === yesterday.toDateString()) {
                    newStreak += 1;
                } else {
                    newStreak = 1;
                }
            }

            const newTotalRead = currentStats.totalAyahsRead + 1;
            const wasActiveToday = lastActive === todayDate;
            const newTotalActiveDays = wasActiveToday ? currentStats.totalActiveDays : (currentStats.totalActiveDays + 1);

            // Optimistic Stats Update (Functional update still good practice, but we base logic on Ref for consistency if needed)
            // Here we use the calculated values to ensure DB and State match
            setUserStats(prev => ({
                ...prev,
                totalAyahsRead: newTotalRead,
                currentStreak: newStreak,
                lastActiveDate: new Date().toISOString(),
                totalActiveDays: newTotalActiveDays
            }));

            // DB Profile Update
            if (lastActive !== todayDate || true) {
                supabase.from('profiles').update({
                    total_ayahs_read: newTotalRead,
                    current_streak: newStreak,
                    last_active_date: new Date().toISOString()
                }).eq('id', user.id).then(res => {
                    if (res.error) console.error("Error updating profile stats:", res.error);
                });
            }

        } catch (error) {
            console.error('Error updating history:', error);
        }
    }, [user]);

    const value = React.useMemo(() => ({
        bookmarks,
        readingHistory,
        userStats,
        dailyActivity,
        isLoading,
        addBookmark,
        removeBookmark,
        isBookmarked,
        updateReadingHistory: updateReadingHistoryStable,
        setDailyGoal,
        setWeeklyGoal
    }), [bookmarks, readingHistory, userStats, dailyActivity, isLoading, addBookmark, removeBookmark, isBookmarked, updateReadingHistoryStable, setDailyGoal, setWeeklyGoal]);

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
