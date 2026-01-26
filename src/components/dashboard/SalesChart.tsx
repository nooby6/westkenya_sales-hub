import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { kgToMetricTonnes } from '@/lib/unit-converter';

// Sample data - in production this would come from the database
// Values represent revenue that translates to metric tonnes for reporting
const data = [
  { name: 'Jan', sales: 4000000, orders: 240 },
  { name: 'Feb', sales: 3000000, orders: 198 },
  { name: 'Mar', sales: 5000000, orders: 300 },
  { name: 'Apr', sales: 4500000, orders: 278 },
  { name: 'May', sales: 6000000, orders: 389 },
  { name: 'Jun', sales: 5500000, orders: 349 },
  { name: 'Jul', sales: 7000000, orders: 430 },
].map(item => ({
  ...item,
  salesMT: kgToMetricTonnes(item.sales),
}));

export function SalesChart() {
  return (
    <AnimatedCard delay={150}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold">Sales Overview (Metric Tonnes)</AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}K MT`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toLocaleString()} MT`, 'Revenue']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="salesMT"
              name="Sales (MT)"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorSales)"
              strokeWidth={2}
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
