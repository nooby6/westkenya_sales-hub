import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import {
  AnimatedCard,
  AnimatedCardContent,
} from '@/components/ui/animated-card';

interface StatsCardProps {
  title: string;
  value: string | number;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  numericValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  description, 
  icon: Icon, 
  trend, 
  className,
  delay = 0
}: StatsCardProps) {
  return (
    <AnimatedCard className={cn("relative overflow-hidden group", className)} delay={delay}>
      <AnimatedCardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-bold text-foreground">
              {numericValue !== undefined ? (
                <AnimatedCounter 
                  value={numericValue} 
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                />
              ) : (
                value
              )}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "mt-2 flex items-center text-sm font-medium animate-fade-in",
                trend.isPositive ? "text-chart-1" : "text-destructive"
              )}>
                <span className="inline-flex items-center gap-1">
                  <span className={cn(
                    "inline-block transition-transform duration-300",
                    trend.isPositive ? "animate-bounce-in" : ""
                  )}>
                    {trend.isPositive ? '↑' : '↓'}
                  </span>
                  {trend.value}%
                </span>
                <span className="ml-1 text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
            <Icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
