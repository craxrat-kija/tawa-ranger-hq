import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  label: string;
  icon: LucideIcon;
  delay?: number;
}

export const AnimatedCounter = ({ end, duration = 2000, label, icon: Icon, delay = 0 }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration, isVisible]);

  return (
    <div 
      className={`bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
        isVisible ? "animate-counter" : "opacity-0"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <div className="text-3xl font-bold text-primary">{count}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
};
