import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Package, ShoppingCart, Truck } from 'lucide-react';

export function RealtimeNotifications() {
  const queryClient = useQueryClient();
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    // Subscribe to inventory changes for low stock alerts
    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory',
        },
        async (payload) => {
          const newQuantity = payload.new.quantity;
          
          // Fetch product details to check min_stock_level
          const { data: inventoryWithProduct } = await supabase
            .from('inventory')
            .select('*, products(name, min_stock_level)')
            .eq('id', payload.new.id)
            .single();
          
          if (inventoryWithProduct) {
            const minLevel = inventoryWithProduct.products?.min_stock_level || 100;
            
            if (newQuantity <= minLevel) {
              toast.warning(
                `Low Stock Alert: ${inventoryWithProduct.products?.name}`,
                {
                  description: `Stock level is ${newQuantity} units (min: ${minLevel})`,
                  icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                  duration: 8000,
                }
              );
            }
          }
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['inventory'] });
          queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    // Subscribe to order changes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales_orders',
        },
        async (payload) => {
          const { data: order } = await supabase
            .from('sales_orders')
            .select('*, customers(name)')
            .eq('id', payload.new.id)
            .single();
          
          if (order) {
            toast.info(`New Order: ${order.order_number}`, {
              description: `From ${order.customers?.name || 'Unknown'} - KES ${Number(order.total_amount).toLocaleString()}`,
              icon: <ShoppingCart className="h-4 w-4 text-primary" />,
              duration: 5000,
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales_orders',
        },
        async (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          if (oldStatus !== newStatus) {
            const { data: order } = await supabase
              .from('sales_orders')
              .select('order_number')
              .eq('id', payload.new.id)
              .single();
            
            const statusIcons: Record<string, React.ReactNode> = {
              confirmed: <Package className="h-4 w-4 text-blue-500" />,
              processing: <Package className="h-4 w-4 text-purple-500" />,
              dispatched: <Truck className="h-4 w-4 text-orange-500" />,
              delivered: <Package className="h-4 w-4 text-green-500" />,
            };
            
            toast.success(`Order ${order?.order_number} Updated`, {
              description: `Status changed to ${newStatus}`,
              icon: statusIcons[newStatus] || <ShoppingCart className="h-4 w-4" />,
              duration: 4000,
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['recent-orders'] });
        }
      )
      .subscribe();

    // Subscribe to shipment changes
    const shipmentsChannel = supabase
      .channel('shipments-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shipments',
        },
        (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          if (oldStatus !== newStatus && newStatus === 'delivered') {
            toast.success('Shipment Delivered!', {
              description: 'A shipment has been marked as delivered',
              icon: <Truck className="h-4 w-4 text-green-500" />,
              duration: 5000,
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ['shipments'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(shipmentsChannel);
      subscribedRef.current = false;
    };
  }, [queryClient]);

  return null; // This is a utility component, no UI
}
