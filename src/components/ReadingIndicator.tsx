import React from "react";
import { Check, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadingIndicatorProps {
  status: "seen" | "read" | "engaged" | null;
  className?: string;
}

export const ReadingIndicator: React.FC<ReadingIndicatorProps> = ({ status, className }) => {
  if (!status) return <div className={cn("w-4 h-4 rounded-full border border-muted-foreground/20", className)} />;

  return (
    <div className={cn("flex items-center justify-center transition-all duration-500", className)}>
      {status === "seen" && (
        <div className="w-4 h-4 rounded-full border-2 border-primary/40 flex items-center justify-center animate-pulse">
           <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </div>
      )}
      {status === "read" && (
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}
      {status === "engaged" && (
        <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        </div>
      )}
    </div>
  );
};
