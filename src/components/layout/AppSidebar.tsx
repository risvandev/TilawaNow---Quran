import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  Sparkles,
  LayoutDashboard,
  Info,
  Mail,
  Settings,
  HelpCircle,
  Lock,
  ChevronRight,
} from "lucide-react";

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isHovered, setIsHovered }}>
      {children}
    </SidebarContext.Provider>
  );
};

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Read Quran", path: "/read" },
  { icon: Sparkles, label: "AI Chat", path: "/ai" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Info, label: "About", path: "/about" },
  { icon: Mail, label: "Contact", path: "/contact" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { isExpanded, setIsExpanded, isHovered, setIsHovered } = useSidebar();

  const shouldShowExpanded = isExpanded || isHovered;

  const renderNavItem = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.path ||
      (item.path === "/read" && location.pathname.startsWith("/read"));
    return (
      <Link key={item.path} to={item.path}>
        <Button
          variant={isActive ? "sidebarActive" : "sidebar"}
          size="default"
          className={cn(
            "w-full transition-all duration-200",
            !shouldShowExpanded && "justify-center px-2"
          )}
        >
          <item.icon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
          {shouldShowExpanded && (
            <span className="ml-3 animate-fade-in truncate">{item.label}</span>
          )}
        </Button>
      </Link>
    );
  };

  return (
    <aside
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50",
        "transition-all duration-300 ease-in-out flex flex-col",
        shouldShowExpanded ? "w-64" : "w-[72px]"
      )}
    >
      {/* Header with logo and toggle */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <Link to="/home" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center p-1.5">
            <img src="/quran-logo.svg" alt="Tadabbur Logo" className="w-full h-full object-contain" />
          </div>
          {shouldShowExpanded && (
            <span className="font-semibold text-foreground animate-fade-in">Tadabbur</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <Lock className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(renderNavItem)}
        </div>

        <div className="mt-auto pt-4 space-y-1">
          {bottomNavItems.map(renderNavItem)}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="h-5 flex items-center justify-center">
          {shouldShowExpanded ? (
            <p className="text-xs text-muted-foreground text-center animate-fade-in whitespace-nowrap">
              Free Forever • Made with ❤️
            </p>
          ) : (
            <div className="w-2 h-2 rounded-full bg-primary" />
          )}
        </div>
      </div>
    </aside>
  );
};

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 pb-[env(safe-area-inset-bottom)] bg-background/80 backdrop-blur-lg border-t border-border z-[100] md:hidden flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path === "/read" && location.pathname.startsWith("/read"));
        return (
          <Link key={item.path} to={item.path} className="flex-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-full h-full rounded-none flex flex-col items-center justify-center gap-1 hover:bg-transparent",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
              <span className="text-[10px] font-medium truncate max-w-full px-1">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
};

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  const { isExpanded, isHovered } = useSidebar();
  const shouldShowExpanded = isExpanded || isHovered;

  if (!showSidebar) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen flex w-full bg-background selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />

      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          "ml-0 md:ml-[72px]", // Base mobile: no margin, Base desktop: collapsed margin
          shouldShowExpanded && "md:ml-64", // Expanded desktop margin
          "pb-20 md:pb-0", // Add padding on bottom for mobile nav
          "max-md:!ml-0 max-md:!pl-0 max-md:w-full" // Force reset for mobile
        )}
      >
        {children}
      </main>
    </div>
  );
};
