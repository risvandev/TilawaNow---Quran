import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface LogoProps {
    className?: string; // For the container
    textClassName?: string; // For the text
    iconClassName?: string; // For the icon container or image
    showText?: boolean; // Option to hide text if needed
    arabicClassName?: string; // Optional specific sizes for Arabic text
}

export const Logo = ({
    className,
    textClassName,
    iconClassName,
    showText = true,
    arabicClassName = "text-lg md:text-xl"
}: LogoProps) => {
    const [showArabic, setShowArabic] = useState(false);
    const [isFading, setIsFading] = useState(false);
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setShowArabic((prev) => !prev);
                setIsFading(false);
            }, 300); // Wait for fade out
        }, 4000); // Switch every 4 seconds

        return () => clearInterval(interval);
    }, []);

    // Defalt to white logo for SSR to match dark theme default
    const logoSrc = mounted && resolvedTheme === "light" 
        ? "/quransite_black_small.png" 
        : "/quransite_white_small.png";

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("rounded-lg bg-primary/10 flex items-center justify-center p-1 backdrop-blur-sm", iconClassName)}>
                <img src={logoSrc} alt="TilawaNow Logo" className="w-full h-full object-contain" />
            </div>

            <span
                className={cn(
                    "font-bold text-foreground transition-all duration-200 ease-in-out overflow-hidden whitespace-nowrap",
                    showText ? "max-w-[200px] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0",
                    isFading ? "opacity-0" : "",
                    showArabic ? cn("font-arabic", arabicClassName) : "", 
                    textClassName
                )}
            >
                {showArabic ? "تِلاوَة الآن" : "TilawaNow"}
            </span>
        </div>
    );
};
