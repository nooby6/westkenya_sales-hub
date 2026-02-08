import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const sugarTypeLabels: Record<string, string> = {
  bale_2x10: 'Bale 2Kg×10',
  bale_1x20: 'Bale 1Kg×20',
  bale_1x12: 'Bale 1Kg×12',
  bag_50kg: 'Bag 50Kg',
  bag_25kg: 'Bag 25Kg',
};

export function RevenueByProductChart() {
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-by-product'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('total_price, products (name, sugar_type)');

      if (error) throw error;

      // Group by sugar type
      const revenueByType: Record<string, number> = {};
      (data || []).forEach((item: any) => {
        const type = item.products?.sugar_type || 'other';
        revenueByType[type] = (revenueByType[type] || 0) + Number(item.total_price);
      });

      return Object.entries(revenueByType)
        .map(([type, revenue]) => ({
          name: sugarTypeLabels[type] || type,
          revenue,
          revenueMillion: revenue / 1000000,
        }))
        .sort((a, b) => b.revenue - a.revenue);
    },
  });

  const chartData = revenueData?.length ? revenueData : [
    { name: 'Bale 2 Kg×10', revenue: 4500000, revenueMillion: 4.5 },
    { name: 'Bag 50 Kg', revenue: 3200000, revenueMillion: 3.2 },
    { name: 'Bale 1 Kg×20', revenue: 2800000, revenueMillion: 2.8 },
    { name: 'Bag 25Kg', revenue: 1900000, revenueMillion: 1.9 },
    { name: 'Bale 1 Kg×12', revenue: 1500000, revenueMillion: 1.5 },
  ];

  return (
    <AnimatedCard delay={900}>
      <AnimatedCardHeader className="flex flex-row items-center justify-between pb-2">
        <AnimatedCardTitle className="text-base font-medium">
          Revenue by Sugar Type
        </AnimatedCardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} animationDuration={1200}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
