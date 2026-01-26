import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package } from 'lucide-react';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMetricTonnes } from '@/lib/unit-converter';

export function InventoryAlerts() {
  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (name, sku, min_stock_level, sugar_type),
          depots (name)
        `)
        .order('quantity', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      // Filter for low stock items
      return data?.filter(item => 
        item.quantity < (item.products?.min_stock_level || 100)
      ) || [];
    }
  });

  if (isLoading) {
    return (
      <AnimatedCard delay={200}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            Low Stock Alerts
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </AnimatedCardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard delay={200}>
      <AnimatedCardHeader>
        <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
          Low Stock Alerts
        </AnimatedCardTitle>
      </AnimatedCardHeader>
      <AnimatedCardContent>
        {!lowStockItems || lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-fade-in">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20 animate-fade-in transition-all duration-300 hover:bg-destructive/10 hover:border-destructive/40 hover:-translate-x-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div>
                  <p className="font-medium text-sm">{item.products?.name}</p>
                  <p className="text-xs text-muted-foreground">{item.depots?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-destructive">{item.quantity} units</p>
                  <p className="text-xs text-muted-foreground">
                    Min: {item.products?.min_stock_level}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatedCardContent>
    </AnimatedCard>
  );
}
