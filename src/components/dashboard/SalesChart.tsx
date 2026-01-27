import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  AnimatedCard, 
  AnimatedCardContent, 
  AnimatedCardHeader, 
  AnimatedCardTitle 
} from '@/components/ui/animated-card';
import { format, subDays } from 'date-fns';

export function SalesChart() {
  const { data: salesData } = useQuery({
    queryKey: ['sales-chart-data'],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('sales_orders')
        .select('order_date, total_amount')
        .gte('order_date', thirtyDaysAgo)
        .order('order_date', { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const aggregated = (data || []).reduce((acc: Record<string, number>, order) => {
        const date = format(new Date(order.order_date), 'MMM dd');
        acc[date] = (acc[date] || 0) + Number(order.total_amount);
        return acc;
      }, {});

      return Object.entries(aggregated).map(([name, sales]) => ({
        name,
        sales,
        salesMT: sales / 1000000, // For millions display
      }));
    }
  });

  // Fallback sample data if no real data
  const chartData = salesData?.length ? salesData : [
    { name: 'Jan 01', sales: 4000000, salesMT: 4 },
    { name: 'Jan 05', sales: 3000000, salesMT: 3 },
    { name: 'Jan 10', sales: 5000000, salesMT: 5 },
    { name: 'Jan 15', sales: 4500000, salesMT: 4.5 },
    { name: 'Jan 20', sales: 6000000, salesMT: 6 },
    { name: 'Jan 25', sales: 5500000, salesMT: 5.5 },
    { name: 'Jan 30', sales: 7000000, salesMT: 7 },
  ];

  return (
    <AnimatedCard delay={600}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold">Sales Overview</AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
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
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorSales)"
              strokeWidth={3}
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
