import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InventoryAlerts() {
  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (name, sku, min_stock_level),
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!lowStockItems || lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">All stock levels are healthy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20"
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
      </CardContent>
    </Card>
  );
}
