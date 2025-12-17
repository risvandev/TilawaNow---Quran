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
  ChevronLeft,
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isHovered, setIsHovered }}>
      {children}
    </SidebarContext.Provider>
  );
};

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: BookOpen, label: "Read Quran", path: "/read" },
  { icon: Sparkles, label: "AI Assistance", path: "/ai" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Info, label: "About", path: "/about" },
  { icon: Mail, label: "Contact", path: "/contact" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

export const AppSidebar = () => {
  const location = useLocation();
  const { isExpanded, setIsExpanded, isHovered, setIsHovered } = useSidebar();

  const shouldShowExpanded = isExpanded || isHovered;

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
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          {shouldShowExpanded && (
            <span className="font-semibold text-foreground animate-fade-in">Quran</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {shouldShowExpanded ? (
          <p className="text-xs text-muted-foreground text-center animate-fade-in">
            Free Forever • Made with ❤️
          </p>
        ) : (
          <div className="w-2 h-2 rounded-full bg-primary mx-auto" />
        )}
      </div>
    </aside>
  );
};

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const MainLayout = ({ children, showSidebar = true }: MainLayoutProps) => {
  const { isExpanded, isHovered } = useSidebar();
  const shouldShowExpanded = isExpanded || isHovered;

  if (!showSidebar) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main
        className={cn(
          "flex-1 transition-all duration-300",
          shouldShowExpanded ? "ml-64" : "ml-[72px]"
        )}
      >
        {children}
      </main>
    </div>
  );
};
