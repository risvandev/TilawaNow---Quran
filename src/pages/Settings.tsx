import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Moon, Sun, Globe, User, Bell, BookOpen, Volume2, Play, Loader2, Square, MessageCircle, Send, ChevronLeft, ChevronRight, Pencil, Check, X, Heart, HelpCircle, Mail, ShieldCheck, Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTranslationsByLanguage, AVAILABLE_RECITERS } from "@/lib/quran-api";
import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    testAudioInstance: HTMLAudioElement | null;
  }
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [translationId, setTranslationId] = useState("20"); // Default to Saheeh International
  const [activeTab, setActiveTab] = useState("general");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [quranScript, setQuranScript] = useState("text_uthmani");
  const [nightMode, setNightMode] = useState(false);
  const [reciterId, setReciterId] = useState(1);

  // Audio Preview State
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [testAudioLoading, setTestAudioLoading] = useState(false);

  // Donate Dialog State
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // Reminder State
  const [reminderTime, setReminderTime] = useState("");
  const [reminderText, setReminderText] = useState("");

  // Profile Edit State
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!user) {
      // Fallback to local storage if no user
      loadLocalSettings();
      return;
    }

    const loadProfileSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme, translation_id, reciter_id, quran_script, night_mode, notifications_enabled')
          .eq('id', user.id)
          .single();

        if (data) {
          if (data.theme) {
            setTheme(data.theme as "dark" | "light");
            document.documentElement.classList.toggle("light", data.theme === "light");
          }
          if (data.translation_id) {
            setTranslationId(data.translation_id);
            // Update LS for redundancy
            localStorage.setItem("quranTranslation", data.translation_id);
          }
          if (data.reciter_id) setReciterId(data.reciter_id);
          if (data.quran_script) setQuranScript(data.quran_script);
          if (data.night_mode !== null) {
            setNightMode(data.night_mode);
            if (data.night_mode) {
              document.body.classList.add("night-mode");
            } else {
              document.body.classList.remove("night-mode");
            }
          }
          // Handle notifications
          if (data.notifications_enabled !== null) setNotifications(data.notifications_enabled);
        } else {
          // If no profile or error, try local
          loadLocalSettings();
        }

        // Initialize newName with current name
        if (user.user_metadata?.full_name) {
          setNewName(user.user_metadata.full_name);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        loadLocalSettings();
      }
    };

    loadProfileSettings();

    // Cleanup test audio on unmount
    return () => {
      if (window.testAudioInstance) {
        window.testAudioInstance.pause();
        window.testAudioInstance = null;
      }
    };
  }, [user]);

  const loadLocalSettings = () => {
    // Load reciter preference
    const savedReciter = localStorage.getItem("reciterId");
    if (savedReciter) setReciterId(parseInt(savedReciter));

    // Load Reminder settings
    const savedTime = localStorage.getItem("reminderTime");
    const savedText = localStorage.getItem("reminderText");
    if (savedTime) setReminderTime(savedTime);
    if (savedText) setReminderText(savedText);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("light", savedTheme === "light");
    }

    // Check for saved script preference
    const savedScript = localStorage.getItem("quranScript");
    if (savedScript) {
      setQuranScript(savedScript);
    }

    // Check for saved translation preference
    const savedTranslation = localStorage.getItem("quranTranslation");
    if (savedTranslation) {
      setTranslationId(savedTranslation);
    }

    // Check for night mode preference
    const savedNightMode = localStorage.getItem("nightMode") === "true";
    setNightMode(savedNightMode);
    if (savedNightMode) {
      document.body.classList.add("night-mode");
    } else {
      document.body.classList.remove("night-mode");
    }
  };

  const updateProfileSetting = async (key: string, value: any) => {
    if (!user) return;
    try {
      await supabase.from('profiles').update({ [key]: value }).eq('id', user.id);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light", newTheme === "light");
    updateProfileSetting('theme', newTheme);
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} mode`,
    });
  };

  const toggleNightMode = (checked: boolean) => {
    setNightMode(checked);
    localStorage.setItem("nightMode", String(checked));
    updateProfileSetting('night_mode', checked);
    if (checked) {
      document.body.classList.add("night-mode");
      toast({
        title: "Night Mode Enabled",
        description: "Eye comfort filter applied.",
      });
    } else {
      document.body.classList.remove("night-mode");
    }
  };



  const handleNotificationToggle = async (checked: boolean) => {
    if (checked) {
      if (!("Notification" in window)) {
        toast({
          variant: "destructive",
          title: "Not Supported",
          description: "This browser does not support desktop notifications.",
        });
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setNotifications(true);
        updateProfileSetting('notifications_enabled', true);

        // Send immediate test notification
        new Notification("TilawaNow", {
          body: "Notifications active! May your journey be blessed.",
          icon: "/favicon-160x160.png"
        });

        toast({
          title: "Notifications Enabled",
          description: "You will receive daily reading reminders.",
        });
      } else {
        setNotifications(false);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
        });
      }
    } else {
      setNotifications(false);
      updateProfileSetting('notifications_enabled', false);
      toast({
        title: "Notifications Disabled",
        description: "You won't receive any notifications.",
      });
    }
  };

  const handleSaveReminder = () => {
    localStorage.setItem("reminderTime", reminderTime);
    localStorage.setItem("reminderText", reminderText);
    toast({
      title: "Reminder Set",
      description: `We'll notify you daily at ${reminderTime}`,
    });
  };

  const handleUpdateProfileName = async () => {
    if (!user || !newName.trim()) return;

    try {
      // 1. Update Auth Metadata (for session/navbar)
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: newName }
      });

      if (authError) throw authError;

      // 2. Update Public Profile (for database persistence)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setEditingName(false);
      toast({
        title: "Profile Updated",
        description: "Your name has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update your profile name.",
      });
    }
  };

  const handleDonate = () => {
    setIsDonateOpen(true);
  };

  return (
    <div className="bg-background flex-1">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 md:max-w-5xl">
        {/* Mobile Header (Back + Title Inline) */}
        <div className="md:hidden flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (showMobileDetail) {
                setShowMobileDetail(false);
              } else {
                navigate(-1);
              }
            }}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          {!showMobileDetail ? (
            <div>
              <h1 className="text-xl font-bold text-foreground">Settings</h1>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-foreground capitalize">
                {activeTab === "notifications" ? "Notification" : activeTab} Settings
              </h1>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Customize your experience</p>
            </div>
          </div>
        </div>

        {/* Tabs Layout */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col md:flex-row gap-6 md:gap-10"
        >
          {/* Mobile Menu List (Visible only on mobile when no detail is open) */}
          <div className={`${showMobileDetail ? 'hidden' : 'flex'} md:hidden flex-col gap-1 w-full`}>
            <button
              onClick={() => { setActiveTab("general"); setShowMobileDetail(true); }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                  <SettingsIcon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-foreground">General</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => { setActiveTab("reading"); setShowMobileDetail(true); }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-foreground">Reading & Audio</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => { setActiveTab("notifications"); setShowMobileDetail(true); }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-foreground">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => { setActiveTab("profile"); setShowMobileDetail(true); }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-foreground">Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Help & Support (Mobile) */}
            <button
              onClick={() => navigate("/help")}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-foreground">Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Contact (Mobile) */}
            <button
              onClick={() => navigate("/contact")}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 rounded-md text-primary group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm text-foreground">Contact</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Donate Item (Mobile) */}
            <button
              onClick={handleDonate}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group mt-2"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-pink-500/10 rounded-md text-pink-500 group-hover:bg-pink-500/20 transition-colors">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <span className="font-medium text-sm text-foreground">Support Us</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Desktop Sidebar (Hidden on mobile) */}
          <TabsList className="hidden md:flex flex-col justify-start w-64 bg-transparent p-0 gap-2 h-auto">
            <TabsTrigger
              value="general"
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all"
            >
              <SettingsIcon className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="reading"
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all"
            >
              <BookOpen className="w-4 h-4" />
              Reading & Audio
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="w-full justify-start gap-3 px-4 py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all"
            >
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <div className={`flex-1 min-w-0 ${showMobileDetail ? 'block' : 'hidden md:block'}`}>
            {/* General Tab */}
            <TabsContent value="general" className="mt-0 space-y-6 animate-fade-in">
              {/* Appearance */}
              <div className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  Appearance
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === "dark" ? "Currently using dark theme" : "Currently using light theme"}
                    </p>
                  </div>
                  <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4">
                  <div>
                    <p className="font-medium text-foreground">Night Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Eye comfort filter (warm tint)
                    </p>
                  </div>
                  <Switch checked={nightMode} onCheckedChange={toggleNightMode} />
                </div>
              </div>

              {/* Language */}
              <div className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Language & Translation
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Translation Edition
                    </label>
                    <Select
                      value={translationId}
                      onValueChange={(value) => {
                        setTranslationId(value);
                        localStorage.setItem("quranTranslation", value);
                        updateProfileSetting('translation_id', value);

                        // Find and save name for AI Story Mode
                        const allTranslations = getTranslationsByLanguage();
                        let selectedName = "English";
                        for (const langKey in allTranslations) {
                          const found = allTranslations[langKey].find(t => t.id.toString() === value);
                          if (found) {
                            localStorage.setItem("selectedTranslationName", langKey);
                            break;
                          }
                        }

                        toast({
                          title: "Translation Updated",
                          description: "Quran translation has been updated.",
                        });
                      }}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select translation" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Object.entries(getTranslationsByLanguage()).map(([language, translations]) => (
                          <SelectGroup key={language}>
                            <SelectLabel>{language}</SelectLabel>
                            {translations.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Reading Tab */}
            <TabsContent value="reading" className="mt-0 space-y-6 animate-fade-in">
              {/* Reading Preferences */}
              <div className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Reading Preferences
                </h2>
                <div className="space-y-6">
                  {/* Script Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Quran Text Script
                    </label>
                    <Select
                      value={quranScript}
                      onValueChange={(value) => {
                        setQuranScript(value);
                        localStorage.setItem("quranScript", value);
                        updateProfileSetting('quran_script', value);
                        toast({
                          title: "Script Updated",
                          description: "Quran script has been updated.",
                        });
                      }}
                    >
                      <SelectTrigger className="bg-secondary border-border w-full">
                        <SelectValue placeholder="Select script style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text_uthmani">Uthmani (Default)</SelectItem>
                        <SelectItem value="text_indopak">IndoPak (Asian)</SelectItem>
                        <SelectItem value="text_imlaei">Simple (Imlaei)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Audio Preferences */}
              <div className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Audio Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Reciter (Qari)
                    </label>
                    <div className="flex gap-2">
                      <Select
                        value={reciterId.toString()}
                        onValueChange={(value) => {
                          setReciterId(parseInt(value));
                          localStorage.setItem("reciterId", value);
                          updateProfileSetting('reciter_id', parseInt(value));
                          toast({
                            title: "Reciter Updated",
                            description: "Audio selection has been saved.",
                          });
                        }}
                      >
                        <SelectTrigger className="bg-secondary border-border flex-1">
                          <SelectValue placeholder="Select a reciter" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_RECITERS.map((reciter) => (
                            <SelectItem key={reciter.id} value={reciter.id.toString()}>
                              {reciter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 w-10 h-10"
                        title={testAudioPlaying ? "Stop" : "Test Audio"}
                        onClick={() => {
                          if (testAudioPlaying) {
                            if (window.testAudioInstance) {
                              window.testAudioInstance.pause();
                              window.testAudioInstance = null;
                            }
                            setTestAudioPlaying(false);
                            setTestAudioLoading(false);
                            return;
                          }

                          setTestAudioLoading(true);

                          if (window.testAudioInstance) {
                            window.testAudioInstance.pause();
                          }

                          fetch(`https://api.quran.com/api/v4/recitations/${reciterId}/by_ayah/1:1`)
                            .then(res => res.json())
                            .then(data => {
                              if (data.audio_files?.[0]?.url) {
                                const url = data.audio_files[0].url;
                                const fullUrl = url.startsWith('http') ? url : `https://verses.quran.com/${url}`;

                                const audio = new Audio(fullUrl);
                                window.testAudioInstance = audio;

                                audio.addEventListener('canplay', () => {
                                  setTestAudioLoading(false);
                                  setTestAudioPlaying(true);
                                  audio.play();
                                });

                                audio.addEventListener('ended', () => {
                                  setTestAudioPlaying(false);
                                  window.testAudioInstance = null;
                                });

                                audio.addEventListener('error', (e) => {
                                  console.error("Audio playback error:", e, fullUrl);
                                  setTestAudioLoading(false);
                                  toast({ variant: "destructive", title: "Playback Error", description: "Could not play test audio." });
                                });
                              } else {
                                console.error("No audio file found for 1:1");
                                setTestAudioLoading(false);
                                toast({ variant: "destructive", title: "Audio Not Found", description: "This reciter may not have audio for Fatiha." });
                              }
                            })
                            .catch((err) => {
                              console.error("Fetch error:", err);
                              setTestAudioLoading(false);
                              toast({ variant: "destructive", title: "Network Error", description: "Failed to fetch audio details." });
                            });
                        }}
                      >
                        {testAudioLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : testAudioPlaying ? (
                          <Square className="w-4 h-4 fill-primary text-primary" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: "Al-Husary" and "AbdulBaset" have the best word-by-word highlighting support.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="mt-0 space-y-6 animate-fade-in">
              <div className="glass-card p-4 md:p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </h2>
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                        <Send className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">Join our Telegram Community</h3>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          Get daily reading details, specific insights, and stay updated with the community.
                        </p>
                        <Button
                          className="w-full sm:w-auto gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white border-none"
                          onClick={() => window.open("https://t.me/TadabburOfficial", "_blank")}
                        >
                          <Send className="w-4 h-4" />
                          Join Community
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4">
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive daily reading reminders
                      </p>
                    </div>
                    <Switch checked={notifications} onCheckedChange={handleNotificationToggle} />
                  </div>

                  {notifications && (
                    <div className="pt-4 mt-4 border-t border-border/50 animate-fade-in-up">
                      <h3 className="text-sm font-medium text-foreground mb-3">Custom Daily Reminder</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Time</label>
                          <Input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="bg-secondary/50 border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Message</label>
                          <Input
                            type="text"
                            placeholder="It's time for your daily Quran reading"
                            value={reminderText}
                            onChange={(e) => setReminderText(e.target.value)}
                            className="bg-secondary/50 border-border"
                          />
                        </div>
                      </div>
                      <Button size="sm" onClick={handleSaveReminder} className="w-full sm:w-auto">
                        Save Reminder
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0 space-y-6 animate-fade-in">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile
                </h2>
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingName ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="h-8 max-w-[200px]"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={handleUpdateProfileName}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                              setEditingName(false);
                              setNewName(user.user_metadata.full_name || "");
                            }}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <p className="font-medium text-foreground truncate">
                              {newName || user.user_metadata.full_name || "User"}
                            </p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setNewName(user.user_metadata.full_name || "");
                                setEditingName(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                          Sign Out
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sign Out</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to sign out? You will need to log in again to access personalized features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => signOut()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sign Out
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm mb-4">
                      Sign in to save your reading progress across devices and unlock personalized features.
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/login">Sign In</a>
                    </Button>
                  </>
                )}
              </div>

              {/* Support / Donate Section */}
              <div className="glass-card p-6 border-pink-500/20 bg-pink-500/5">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                  Support Our Mission
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Support its development voluntarily. Access will <strong className="text-foreground">always be free</strong>.
                </p>
                <Button
                  onClick={handleDonate}
                  variant="hero"
                  className="w-full gap-2"
                >
                  <Heart className="w-4 h-4 fill-primary/20" />
                  Donate to Support
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

      </div>


      {/* Donate Dialog */}
      <Dialog open={isDonateOpen} onOpenChange={setIsDonateOpen}>
        <DialogContent className="sm:max-w-[300px] w-[90%] bg-card border-border p-5 gap-0 shadow-xl rounded-2xl mx-auto">
          <div className="flex flex-col items-center text-center">

            <DialogTitle className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-primary fill-primary/20" />
              Support Tadabbur
            </DialogTitle>

            <DialogDescription className="text-muted-foreground text-xs mx-auto mb-4 leading-tight">
              Your contribution helps keep the Qur'an accessible.
            </DialogDescription>

            {/* QR Code - Minimal & Clean */}
            <div className="bg-white p-3 rounded-xl shadow-sm border border-neutral-100 mb-3">
              <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/TilawaNow_qr_code.png" alt="Donate QR Code" className="w-full h-full object-contain" />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground font-medium opacity-60">
              Secure Donation
            </p>

          </div>

          <div className="mt-4 pt-3 border-t border-border/40 flex justify-center">
            <button
              onClick={() => setIsDonateOpen(false)}
              className="text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
