import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, MainLayout } from "@/components/layout/AppSidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import ReadQuran from "./pages/ReadQuran";
import AIAssistance from "./pages/AIAssistance";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SurahInfoPage from "./pages/SurahInfoPage";
import SurahStoryPage from "./pages/SurahStoryPage";

const queryClient = new QueryClient();

// Daily Rotation Messages
const DAILY_NOTIFICATIONS = {
  1: "A gentle reminder to begin the week with a few moments of reflection on the Qur’an.", // Mon
  2: "Understanding a single verse today can be more meaningful than reading many without reflection.", // Tue
  3: "Take a short pause today to listen to the Qur’an and let its meaning settle in the heart.", // Wed
  4: "As the week nears its end, a quiet moment with the Qur’an can bring balance and clarity.", // Thu
  5: "Today is Jumuʿah — a good time to read Surah Al-Kahf and reflect.", // Fri
  6: "Use today’s calm moments to return to the verse you last reflected on.", // Sat
  0: "End the week with gratitude and a few moments of reflection on the Qur’an." // Sun
};

// Layout wrapper that conditionally shows sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const pagesWithoutSidebar = ["/", "/privacy", "/terms"];

  let showSidebar = !pagesWithoutSidebar.includes(location.pathname);

  // Special case: Hide sidebar on About page for guests (not logged in) OR if coming from Landing Page Footer
  const fromLanding = location.state?.fromLanding;
  if (location.pathname === "/about" && (!user || fromLanding)) {
    showSidebar = false;
  }

  // Global Notification Check
  useEffect(() => {
    const checkReminder = () => {
      if (Notification.permission !== "granted") return;

      const savedTime = localStorage.getItem("reminderTime");
      if (!savedTime) return;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      if (currentTime === savedTime) {
        // Prevent duplicate notifications if check runs multiple times in same minute
        const lastSent = sessionStorage.getItem("lastNotificationSent");
        if (lastSent === currentTime) return;

        const customMessage = localStorage.getItem("reminderText");
        let message = customMessage;

        if (!message) {
          const distinctDay = new Date().getDay() as keyof typeof DAILY_NOTIFICATIONS;
          message = DAILY_NOTIFICATIONS[distinctDay];
        }

        new Notification("Your Reminder", {
          body: message,
          icon: "/favicon-160x160.png"
        });

        sessionStorage.setItem("lastNotificationSent", currentTime);
      }
    };

    // Check immediately and then every minute
    checkReminder();
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, []);

  return <MainLayout showSidebar={showSidebar}>{children}</MainLayout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page as the main entry */}
      <Route path="/" element={<Landing />} />

      {/* Home dashboard (accessible after clicking "Begin Your Journey") */}
      <Route
        path="/home"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />

      {/* Quran reading */}
      <Route
        path="/read"
        element={
          <AppLayout>
            <ReadQuran />
          </AppLayout>
        }
      />
      <Route
        path="/read/:surahId"
        element={
          <AppLayout>
            <ReadQuran />
          </AppLayout>
        }
      />

      {/* Surah Info Page (Minimal) */}
      <Route path="/info/:surahId" element={<SurahInfoPage />} />

      {/* Surah Story Mode */}
      <Route path="/story/:surahId" element={<SurahStoryPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* AI Assistant */}
        <Route
          path="/ai"
          element={
            <AppLayout>
              <AIAssistance />
            </AppLayout>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />
      </Route>

      {/* Public Routes */}
      {/* Dashboard (Handles its own auth state) */}
      <Route
        path="/dashboard"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />

      {/* About */}
      <Route
        path="/about"
        element={
          <AppLayout>
            <About />
          </AppLayout>
        }
      />

      {/* Contact */}
      <Route
        path="/contact"
        element={
          <AppLayout>
            <Contact />
          </AppLayout>
        }
      />

      {/* Help & Support */}
      <Route
        path="/help"
        element={
          <AppLayout>
            <HelpSupport />
          </AppLayout>
        }
      />

      {/* Legal pages (no sidebar) */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />

      {/* Authentication (no sidebar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import ScrollToTop from "./components/ScrollToTop";
import { useEffect } from "react";
import { AudioPlayerProvider } from "./contexts/AudioPlayerContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BookmarksProvider } from "./contexts/BookmarksContext";
import GlobalAudioPlayer from "./components/GlobalAudioPlayer";

import { PWAProvider } from "./contexts/PWAContext";

const App = () => {
  // Initialize Quran font preference & Night Mode
  useEffect(() => {
    // Font
    const savedFont = localStorage.getItem("quranFont");
    if (savedFont) {
      document.documentElement.style.setProperty("--font-quran", savedFont);
    }

    // Night Mode
    const savedNightMode = localStorage.getItem("nightMode") === "true";
    if (savedNightMode) {
      document.body.classList.add("night-mode");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PWAProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <AuthProvider>
              <BookmarksProvider>
                <AudioPlayerProvider>
                  <SidebarProvider>
                    <AppRoutes />
                  </SidebarProvider>
                  <GlobalAudioPlayer />
                </AudioPlayerProvider>
              </BookmarksProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </PWAProvider>
    </QueryClientProvider>
  );
};

export default App;
