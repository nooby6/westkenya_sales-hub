import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { formatMetricTonnes, kgToMetricTonnes } from '@/lib/unit-converter';

export function MonthlyPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['monthly-performance'],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('sales_orders')
        .select('order_date, total_amount, status')
        .order('order_date', { ascending: true });

      if (!orders) return [];

      const monthlyData: Record<string, { revenue: number; orders: number; delivered: number }> = {};

      orders.forEach(order => {
        const month = order.order_date.substring(0, 7); // YYYY-MM format
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, orders: 0, delivered: 0 };
        }
        monthlyData[month].revenue += Number(order.total_amount);
        monthlyData[month].orders += 1;
        if (order.status === 'delivered') {
          monthlyData[month].delivered += 1;
        }
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: kgToMetricTonnes(data.revenue),
        orders: data.orders,
        deliveryRate: data.orders > 0 ? (data.delivered / data.orders) * 100 : 0,
      })).slice(-12);
    }
  });

  if (isLoading) {
    return (
      <AnimatedCard delay={250}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Monthly Performance
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <Skeleton className="h-[250px] w-full" />
        </AnimatedCardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard delay={250}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Monthly Performance
        </AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDelivery" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value.toFixed(0)} MT`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
              animationBegin={0}
              animationDuration={1500}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="deliveryRate"
              stroke="hsl(var(--chart-2))"
              fillOpacity={1}
              fill="url(#colorDelivery)"
              strokeWidth={2}
              animationBegin={300}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
