import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string; // For the container
    textClassName?: string; // For the text
    iconClassName?: string; // For the icon container or image
    showText?: boolean; // Option to hide text if needed
}

export const Logo = ({
    className,
    textClassName,
    iconClassName,
    showText = true
}: LogoProps) => {
    const [showArabic, setShowArabic] = useState(false);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setShowArabic((prev) => !prev);
                setIsFading(false);
            }, 300); // Wait for fade out
        }, 4000); // Switch every 4 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("rounded-lg bg-primary/10 flex items-center justify-center p-1 backdrop-blur-sm", iconClassName)}>
                <img src="/quran-logo.svg" alt="TilawaNow Logo" className="w-full h-full object-contain" />
            </div>

            <span
                className={cn(
                    "font-bold text-foreground transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap",
                    showText ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0",
                    isFading ? "opacity-0" : "",
                    showArabic ? "font-arabic text-lg" : "", 
                    textClassName
                )}
            >
                {showArabic ? "تِلاوَة الآن" : "TilawaNow"}
            </span>
        </div>
    );
};
