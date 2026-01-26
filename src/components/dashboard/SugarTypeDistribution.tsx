import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { sugarTypeLabels, kgToMetricTonnes } from '@/lib/unit-converter';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function SugarTypeDistribution() {
  const { data: distribution, isLoading } = useQuery({
    queryKey: ['sugar-type-distribution'],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('products')
        .select('id, sugar_type, unit_price');
      
      const { data: inventory } = await supabase
        .from('inventory')
        .select('product_id, quantity');
      
      if (!products || !inventory) return [];
      
      const typeQuantities: Record<string, number> = {};
      
      inventory.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product?.sugar_type) {
          const type = product.sugar_type;
          typeQuantities[type] = (typeQuantities[type] || 0) + item.quantity;
        }
      });
      
      return Object.entries(typeQuantities).map(([type, quantity]) => ({
        name: sugarTypeLabels[type] || type,
        value: quantity,
        valueInTonnes: kgToMetricTonnes(quantity * (type.includes('50') ? 50 : type.includes('25') ? 25 : type.includes('12') ? 12 : 20)),
      }));
    }
  });

  if (isLoading) {
    return (
      <AnimatedCard delay={200}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold">Sugar Type Distribution</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <Skeleton className="h-[250px] w-full" />
        </AnimatedCardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard delay={200}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold">Sugar Type Distribution</AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="valueInTonnes"
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {distribution?.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Quantity']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
