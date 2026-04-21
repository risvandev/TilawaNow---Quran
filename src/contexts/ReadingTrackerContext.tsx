"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface AyahSignals {
  surahId: number;
  ayahId: number;
  visibleDuration: number;
  score: number;
  lastUpdated: number;
}

interface ReadingTrackerContextType {
  startSession: (surahId: number) => Promise<string | null>;
  endSession: () => Promise<void>;
  logSignal: (surahId: number, ayahId: number, signalType: "visibility" | "interaction" | "scroll") => void;
  activeSessionId: string | null;
  ayahStates: Record<string, "seen" | "read" | "engaged" | null>;
}

const ReadingTrackerContext = createContext<ReadingTrackerContextType | undefined>(undefined);

const FLUSH_INTERVAL = 60000; // 60 seconds (optimized for free plan)

export const ReadingTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSurahIdRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  // Buffering Signals in memory to minimize DB writes
  const signalsBuffer = useRef<Map<string, AyahSignals>>(new Map());
  
  // Track states for UI indicators (e.g. circles/checks)
  const [ayahStates, setAyahStates] = useState<Record<string, "seen" | "read" | "engaged" | null>>({});

  // Circuit Breaker: immediately suspend RDS if Supabase is unreachable (CORS / ERR_FAILED)
  // This keeps the console completely clean when running on localhost without Supabase whitelisting.
  const isRDSSuspendedRef = useRef(false);

  // Instead of an automated probe (which causes console noise), we use a "Lazy Circuit Breaker"
  // that engages only when an actual write or read operation fails.
  const handleRDSError = useCallback((err: any) => {
    const errorCode = err?.code || "";
    const status = err?.status || 0;
    const message = err?.message || "";
    const name = err?.name || "";
    const statusText = err?.statusText || "";

    const isAuthOrNetworkError =
      status === 401 ||
      status === 403 ||
      status >= 400 || 
      errorCode === "42501" || 
      errorCode === "PGRST301" ||
      errorCode === "ERR_NETWORK" ||
      message.toLowerCase().includes("fetch") ||
      message.toLowerCase().includes("cors") ||
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("resource") || // ERR_INSUFFICIENT_RESOURCES
      statusText === "Unauthorized" ||
      name === "TypeError";

    if (isAuthOrNetworkError || !err) {
      if (!isRDSSuspendedRef.current) {
        console.warn("[Supabase] RDS Connection issues detected. Suspending background sync to maintain performance and clean console.");
        isRDSSuspendedRef.current = true;
      }
    } else {
      console.warn("RDS: Unexpected error", err);
    }
  }, []);

  const getStatus = (score: number): "seen" | "read" | "engaged" => {
    if (score >= 4) return "engaged";
    if (score >= 2) return "read";
    return "seen";
  };

  const flush = useCallback(async (overrideSessionId?: string) => {
    const sId = overrideSessionId || sessionIdRef.current;
    if (!user || !sId || signalsBuffer.current.size === 0 || isRDSSuspendedRef.current) return;

    const dataToFlush = Array.from(signalsBuffer.current.entries()).map(([key, signals]) => ({
      user_id: user.id,
      session_id: sId,
      surah_id: signals.surahId,
      ayah_id: signals.ayahId,
      visible_duration: Math.round(signals.visibleDuration / 1000), // convert to seconds
      score: signals.score,
      status: getStatus(signals.score)
    }));

    // Clear buffer immediately to prevent concurrent flush overlaps
    const currentBuffer = Array.from(signalsBuffer.current.values());
    signalsBuffer.current.clear();

    try {
      // Industry Level: UPSERT to avoid duplication and maintain one row per ayah/session
      const { error } = await supabase
        .from("reading_activity")
        .upsert(dataToFlush, { onConflict: "session_id, surah_id, ayah_id" });

      if (error) throw error;

      // Also update user profile with latest position for Resume Engine
      if (currentBuffer.length > 0) {
        const lastActivity = currentBuffer[currentBuffer.length - 1];
        await supabase.from("user_reading_profile").upsert({
          user_id: user.id,
          last_read_surah: lastActivity.surahId,
          last_read_ayah: lastActivity.ayahId,
          last_read_timestamp: new Date().toISOString()
        }, { onConflict: "user_id" });
      }
    } catch (err) {
      handleRDSError(err);
    }
  }, [user]);

  const endSession = useCallback(async () => {
    const sId = sessionIdRef.current;
    if (!sId || isRDSSuspendedRef.current) return;

    // Clear session state immediately to prevent re-entry
    sessionIdRef.current = null;
    setActiveSessionId(null);
    activeSurahIdRef.current = null;

    // Final flush of remaining signals
    await flush(sId);

    // If flush failed and suspended RDS, stop here to avoid more console noise
    if (isRDSSuspendedRef.current) return;

    try {
      // Fetch session to calculate duration
      const { data: sessionData, error: fetchError } = await supabase
        .from("reading_sessions")
        .select("start_time")
        .eq("id", sId)
        .single();
      
      if (fetchError) throw fetchError;

      let duration = 0;
      if (sessionData) {
        const start = new Date(sessionData.start_time).getTime();
        const end = Date.now();
        duration = Math.round((end - start) / 1000);
      }

      // Check again before update
      if (isRDSSuspendedRef.current) return;

      const { error: updateError } = await supabase
        .from("reading_sessions")
        .update({ 
          end_time: new Date().toISOString(),
          duration
        })
        .eq("id", sId);

      if (updateError) throw updateError;
    } catch (err) {
      handleRDSError(err);
    }
  }, [flush, handleRDSError]);

  const startSession = useCallback(async (surahId: number) => {
    // Idempotent Guard: If a session for this surah is already active, don't restart it
    if (sessionIdRef.current && activeSurahIdRef.current === surahId) {
      console.log(`[ReadingTracker] Session for Surah ${surahId} is already active (${sessionIdRef.current}). Skipping restart.`);
      return sessionIdRef.current;
    }

    // Finalize previous if exists
    if (sessionIdRef.current) await endSession();

    try {
      const { data, error } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: user?.id,
          surah_id: surahId,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setActiveSessionId(data.id);
      sessionIdRef.current = data.id;
      activeSurahIdRef.current = surahId;
      console.log(`[ReadingTracker] Started new session ${data.id} for Surah ${surahId}`);
      return data.id;
    } catch (err) {
      handleRDSError(err);
      return null;
    }
  }, [user, endSession, handleRDSError]);

  const logSignal = useCallback((surahId: number, ayahId: number, type: "visibility" | "interaction" | "scroll") => {
    const key = `${surahId}:${ayahId}`;
    const now = Date.now();
    
    let current = signalsBuffer.current.get(key) || {
      surahId,
      ayahId,
      visibleDuration: 0,
      score: 0,
      lastUpdated: now
    };

    if (type === "visibility") {
      const delta = now - current.lastUpdated;
      current.visibleDuration += delta;
      
      // Every 3s threshold adds 1 to score
      if (current.visibleDuration > 3000 && current.score < 1) {
        current.score += 1;
      }
    } else if (type === "interaction") {
      current.score += 2; // Interaction is high-confidence (bookmark, copy, AI)
    } else if (type === "scroll") {
      current.score += 1; // Scroll pause indicates reading intent
    }

    current.lastUpdated = now;
    signalsBuffer.current.set(key, current);

    // Update UI state for indicators (debounced or immediate)
    const newStatus = getStatus(current.score);
    setAyahStates(prev => {
      if (prev[key] === newStatus) return prev;
      return { ...prev, [key]: newStatus };
    });
  }, []);

  // Flush interval
  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL);
    return () => clearInterval(interval);
  }, [flush]);

  // Industry Level: Handle tab closure/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Note: sync XHR or Beacon is better for beforeunload, but with batching 
      // we just try our best. Final flush is called on session end too.
      flush();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [flush]);

  return (
    <ReadingTrackerContext.Provider value={{
      startSession,
      endSession,
      logSignal,
      activeSessionId,
      ayahStates
    }}>
      {children}
    </ReadingTrackerContext.Provider>
  );
};

export const useReadingTracker = () => {
  const context = useContext(ReadingTrackerContext);
  if (context === undefined) {
    throw new Error("useReadingTracker must be used within a ReadingTrackerProvider");
  }
  return context;
};
