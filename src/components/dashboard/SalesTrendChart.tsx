import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { kgToMetricTonnes } from '@/lib/unit-converter';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function SalesTrendChart() {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales-trend-chart'],
    queryFn: async () => {
      const months = [];
      for (let i = 6; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        months.push({
          start: startOfMonth(date).toISOString(),
          end: endOfMonth(date).toISOString(),
          label: format(date, 'MMM yyyy'),
        });
      }

      const results = await Promise.all(
        months.map(async (month) => {
          const { data: orders } = await supabase
            .from('sales_orders')
            .select('total_amount')
            .gte('order_date', month.start.split('T')[0])
            .lte('order_date', month.end.split('T')[0]);

          const { data: returns } = await supabase
            .from('sales_returns')
            .select('weight_kg')
            .gte('return_date', month.start.split('T')[0])
            .lte('return_date', month.end.split('T')[0]);

          const totalSales = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
          const totalReturns = returns?.reduce((sum, r) => sum + Number(r.weight_kg), 0) || 0;

          return {
            month: month.label,
            sales: kgToMetricTonnes(totalSales),
            returns: kgToMetricTonnes(totalReturns),
            netSales: kgToMetricTonnes(totalSales - totalReturns),
          };
        })
      );

      return results;
    }
  });

  if (isLoading) {
    return (
      <AnimatedCard delay={300}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold">Sales Trend (Metric Tonnes)</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <Skeleton className="h-[300px] w-full" />
        </AnimatedCardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard delay={300}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold">Sales Trend (Metric Tonnes)</AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toFixed(0)} MT`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(2)} MT`,
                name === 'sales' ? 'Sales' : name === 'returns' ? 'Returns' : 'Net Sales'
              ]}
            />
            <Legend />
            <Bar 
              dataKey="sales" 
              fill="hsl(var(--chart-1))" 
              radius={[4, 4, 0, 0]}
              animationBegin={0}
              animationDuration={1000}
            />
            <Bar 
              dataKey="returns" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
              animationBegin={200}
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey="netSales" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
              animationBegin={400}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
