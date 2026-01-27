import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  color?: "primary" | "chart-1" | "chart-2" | "chart-3" | "chart-4" | "destructive";
}

export function ProgressRing({
  value,
  size = 60,
  strokeWidth = 6,
  className,
  showValue = true,
  color = "primary",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorMap = {
    primary: "stroke-primary",
    "chart-1": "stroke-[hsl(var(--chart-1))]",
    "chart-2": "stroke-[hsl(var(--chart-2))]",
    "chart-3": "stroke-[hsl(var(--chart-3))]",
    "chart-4": "stroke-[hsl(var(--chart-4))]",
    destructive: "stroke-destructive",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            colorMap[color],
            "transition-all duration-1000 ease-out"
          )}
          style={{
            animation: "progress-ring 1s ease-out forwards",
          }}
        />
      </svg>
      {showValue && (
        <span className="absolute text-sm font-semibold text-foreground">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
