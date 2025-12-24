import { useEffect, useRef, useState } from "react";

interface CounterProps {
    end: number;
    duration?: number;
    className?: string;
}

export const Counter = ({ end, duration = 2000, className }: CounterProps) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            // Easing: easeOutExpo
            const easeOut = (x: number): number => {
                return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
            };

            setCount(Math.floor(easeOut(progress) * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [hasStarted, end, duration]);

    return (
        <span ref={ref} className={className}>
            {count.toLocaleString()}
        </span>
    );
};
