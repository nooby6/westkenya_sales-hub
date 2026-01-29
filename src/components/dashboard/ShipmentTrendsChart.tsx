import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Truck } from 'lucide-react';

export function ShipmentTrendsChart() {
  const { data: shipmentData } = useQuery({
    queryKey: ['shipment-trends'],
    queryFn: async () => {
      const fourteenDaysAgo = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('shipments')
        .select('created_at, status, dispatched_at, delivered_at')
        .gte('created_at', fourteenDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const dailyData: Record<string, { dispatched: number; delivered: number; total: number }> = {};
      
      (data || []).forEach(shipment => {
        const date = format(new Date(shipment.created_at), 'MMM dd');
        if (!dailyData[date]) {
          dailyData[date] = { dispatched: 0, delivered: 0, total: 0 };
        }
        dailyData[date].total++;
        if (shipment.status === 'in_transit') dailyData[date].dispatched++;
        if (shipment.status === 'delivered') dailyData[date].delivered++;
      });

      return Object.entries(dailyData).map(([date, counts]) => ({
        date,
        ...counts,
      }));
    },
  });

  const chartData = shipmentData?.length ? shipmentData : [
    { date: 'Jan 15', total: 8, dispatched: 3, delivered: 5 },
    { date: 'Jan 17', total: 12, dispatched: 5, delivered: 7 },
    { date: 'Jan 19', total: 10, dispatched: 4, delivered: 6 },
    { date: 'Jan 21', total: 15, dispatched: 6, delivered: 9 },
    { date: 'Jan 23', total: 11, dispatched: 4, delivered: 7 },
    { date: 'Jan 25', total: 18, dispatched: 8, delivered: 10 },
    { date: 'Jan 27', total: 14, dispatched: 5, delivered: 9 },
  ];

  return (
    <AnimatedCard delay={950}>
      <AnimatedCardHeader className="flex flex-row items-center justify-between pb-2">
        <AnimatedCardTitle className="text-base font-medium">
          Shipment Trends (14 Days)
        </AnimatedCardTitle>
        <Truck className="h-4 w-4 text-muted-foreground" />
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorDispatched" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
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
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorDelivered)"
              strokeWidth={2}
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="dispatched"
              stroke="hsl(var(--chart-2))"
              fillOpacity={1}
              fill="url(#colorDispatched)"
              strokeWidth={2}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Delivered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">In Transit</span>
          </div>
        </div>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
