import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, TrendingDown } from 'lucide-react';
import { formatMetricTonnes } from '@/lib/unit-converter';

const COLORS = [
  'hsl(var(--destructive))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
];

export function ReturnsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['returns-overview'],
    queryFn: async () => {
      const { data: returns } = await supabase
        .from('sales_returns')
        .select('return_reason, weight_kg, status');

      if (!returns) return { byReason: [], totalWeight: 0, pendingCount: 0 };

      const reasonCounts: Record<string, number> = {};
      let totalWeight = 0;
      let pendingCount = 0;

      returns.forEach(r => {
        reasonCounts[r.return_reason] = (reasonCounts[r.return_reason] || 0) + Number(r.weight_kg);
        totalWeight += Number(r.weight_kg);
        if (r.status === 'pending') pendingCount++;
      });

      const byReason = Object.entries(reasonCounts)
        .map(([reason, weight]) => ({
          name: reason,
          value: weight / 1000, // Convert to metric tonnes
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      return { byReason, totalWeight, pendingCount };
    }
  });

  if (isLoading) {
    return (
      <AnimatedCard delay={400}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            Returns Overview
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <Skeleton className="h-[200px] w-full" />
        </AnimatedCardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard delay={400}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-destructive" />
          Returns Overview
        </AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Returns:</span>
            <span className="font-semibold">{formatMetricTonnes(data?.totalWeight || 0)}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Pending: </span>
            <span className="font-semibold text-destructive">{data?.pendingCount || 0}</span>
          </div>
        </div>
        
        {data?.byReason && data.byReason.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data.byReason}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
                label={({ name, value }) => `${name.slice(0, 10)}...`}
                labelLine={false}
              >
                {data.byReason.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Weight']}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground">
            No returns recorded
          </div>
        )}
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
