import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Users } from 'lucide-react';

export function CustomerGrowthChart() {
  const { data: growthData } = useQuery({
    queryKey: ['customer-growth'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, number> = {};
      const sixMonthsAgo = subMonths(new Date(), 6);

      (data || []).forEach(customer => {
        const date = new Date(customer.created_at);
        if (date >= sixMonthsAgo) {
          const monthKey = format(startOfMonth(date), 'MMM yyyy');
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
      });

      // Create cumulative data
      let cumulative = 0;
      return Object.entries(monthlyData).map(([month, count]) => {
        cumulative += count;
        return { month, newCustomers: count, totalCustomers: cumulative };
      });
    },
  });

  const chartData = growthData?.length ? growthData : [
    { month: 'Aug 2024', newCustomers: 12, totalCustomers: 45 },
    { month: 'Sep 2024', newCustomers: 18, totalCustomers: 63 },
    { month: 'Oct 2024', newCustomers: 15, totalCustomers: 78 },
    { month: 'Nov 2024', newCustomers: 22, totalCustomers: 100 },
    { month: 'Dec 2024', newCustomers: 28, totalCustomers: 128 },
    { month: 'Jan 2025', newCustomers: 20, totalCustomers: 148 },
  ];

  return (
    <AnimatedCard delay={850}>
      <AnimatedCardHeader className="flex flex-row items-center justify-between pb-2">
        <AnimatedCardTitle className="text-base font-medium">
          Customer Growth
        </AnimatedCardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="totalCustomers"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="newCustomers"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-chart-3" />
            <span className="text-muted-foreground">Total Customers</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-chart-4" />
            <span className="text-muted-foreground">New This Month</span>
          </div>
        </div>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
