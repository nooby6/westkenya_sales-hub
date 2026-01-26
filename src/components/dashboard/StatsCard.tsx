import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCard, AnimatedCardContent } from '@/components/ui/animated-card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

export function StatsCard({ title, value, description, icon: Icon, trend, delay = 0 }: StatsCardProps) {
  return (
    <AnimatedCard delay={delay} className="overflow-hidden group">
      <AnimatedCardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground transition-transform duration-300 group-hover:scale-105">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium transition-all duration-300",
                trend.isPositive ? "text-primary" : "text-destructive"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 animate-pulse" />
                ) : (
                  <TrendingDown className="h-3 w-3 animate-pulse" />
                )}
                <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
