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

const FLUSH_INTERVAL = 15000; // 15 seconds

export const ReadingTrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSurahIdRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  
  // Buffering Signals in memory to minimize DB writes
  const signalsBuffer = useRef<Map<string, AyahSignals>>(new Map());
  
  // Track states for UI indicators (e.g. circles/checks)
  const [ayahStates, setAyahStates] = useState<Record<string, "seen" | "read" | "engaged" | null>>({});

  const getStatus = (score: number): "seen" | "read" | "engaged" => {
    if (score >= 4) return "engaged";
    if (score >= 2) return "read";
    return "seen";
  };

  const flush = useCallback(async (overrideSessionId?: string) => {
    const sId = overrideSessionId || sessionIdRef.current;
    if (!user || !sId || signalsBuffer.current.size === 0) return;

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
      console.error("RDS: Flush failed", err);
      // Optional: restore buffer on failure? usually better to just log and move on in high-volume systems
    }
  }, [user]);

  const startSession = async (surahId: number) => {
    if (!user) return null;
    
    // Finalize previous if exists
    if (sessionIdRef.current) await endSession();

    try {
      const { data, error } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: user.id,
          surah_id: surahId,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setActiveSessionId(data.id);
      sessionIdRef.current = data.id;
      activeSurahIdRef.current = surahId;
      return data.id;
    } catch (err) {
      console.error("RDS: Session start failed", err);
      return null;
    }
  };

  const endSession = async () => {
    const sId = sessionIdRef.current;
    if (!sId) return;

    // Clear session state immediately to prevent re-entry
    sessionIdRef.current = null;
    setActiveSessionId(null);
    activeSurahIdRef.current = null;

    // Final flush of remaining signals
    await flush(sId);

    try {
      // Fetch session to calculate duration
      const { data: sessionData } = await supabase
        .from("reading_sessions")
        .select("start_time")
        .eq("id", sId)
        .single();
      
      let duration = 0;
      if (sessionData) {
        const start = new Date(sessionData.start_time).getTime();
        const end = Date.now();
        duration = Math.round((end - start) / 1000);
      }

      await supabase
        .from("reading_sessions")
        .update({ 
          end_time: new Date().toISOString(),
          duration
        })
        .eq("id", sId);
    } catch (err) {
      console.error("RDS: Session end failed", err);
    }
  };

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
