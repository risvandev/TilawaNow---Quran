"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface UserAIMemory {
  lastReadAyah: string | null;
  frequentTopics: string[];
  knowledgeLevel: string;
  strugglePoints: string[];
}

interface AICompanionContextType {
  currentContext: {
    surahId: number | null;
    ayahNumber: number | null;
    verseKey: string | null;
  };
  userAIMemory: UserAIMemory;
  updateCurrentContext: (surahId: number, ayahNumber: number, verseKey: string) => void;
  refreshMemory: () => Promise<void>;
  isLoading: boolean;
}

const AICompanionContext = createContext<AICompanionContextType | undefined>(undefined);

export const AICompanionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentContext, setCurrentContext] = useState<{
    surahId: number | null;
    ayahNumber: number | null;
    verseKey: string | null;
  }>({
    surahId: null,
    ayahNumber: null,
    verseKey: null,
  });

  const [userAIMemory, setUserAIMemory] = useState<UserAIMemory>({
    lastReadAyah: null,
    frequentTopics: [],
    knowledgeLevel: "Beginner",
    strugglePoints: [],
  });

  const refreshMemory = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Fetch Profile Data (topics, level, etc.)
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_read_ayah, frequent_topics, ai_knowledge_level")
        .eq("id", user.id)
        .single();

      // 2. Fetch Struggle Points (Verses with high difficulty or high struggle count)
      const { data: struggleData } = await supabase
        .from("verses_read")
        .select("verse_key")
        .eq("user_id", user.id)
        .or("difficulty_score.gt.3,struggle_count.gt.5")
        .limit(5);

      setUserAIMemory({
        lastReadAyah: profile?.last_read_ayah || null,
        frequentTopics: profile?.frequent_topics || [],
        knowledgeLevel: profile?.ai_knowledge_level || "Beginner",
        strugglePoints: struggleData?.map((v) => v.verse_key) || [],
      });
    } catch (error) {
      console.error("Error refreshing AI memory:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshMemory();
    }
  }, [user, refreshMemory]);

  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateCurrentContext = useCallback((surahId: number, ayahNumber: number, verseKey: string) => {
    setCurrentContext({ surahId, ayahNumber, verseKey });
    
    // Periodically update the last_read_ayah in DB for persistence
    // We debounce this to avoid spamming the DB
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      if (user) {
        await supabase.from("profiles").update({ last_read_ayah: verseKey }).eq("id", user.id);
      }
      timeoutRef.current = null;
    }, 5000);
  }, [user]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <AICompanionContext.Provider
      value={{
        currentContext,
        userAIMemory,
        updateCurrentContext,
        refreshMemory,
        isLoading,
      }}
    >
      {children}
    </AICompanionContext.Provider>
  );
};

export const useAICompanion = () => {
  const context = useContext(AICompanionContext);
  if (context === undefined) {
    throw new Error("useAICompanion must be used within an AICompanionProvider");
  }
  return context;
};
