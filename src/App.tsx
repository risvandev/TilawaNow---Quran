import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, MainLayout } from "@/components/layout/AppSidebar";

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

const queryClient = new QueryClient();

// Layout wrapper that conditionally shows sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const pagesWithoutSidebar = ["/", "/privacy", "/terms"];
  const showSidebar = !pagesWithoutSidebar.includes(location.pathname);

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
      
      {/* AI Assistant */}
      <Route
        path="/ai"
        element={
          <AppLayout>
            <AIAssistance />
          </AppLayout>
        }
      />
      
      {/* Dashboard */}
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
      
      {/* Settings */}
      <Route
        path="/settings"
        element={
          <AppLayout>
            <Settings />
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
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <AppRoutes />
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
