import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, Package, ShoppingCart, Truck } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const queryClient = useQueryClient();

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    // Subscribe to inventory changes for low stock alerts
    const inventoryChannel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory' },
        async (payload) => {
          const newQuantity = payload.new.quantity;
          const { data: inventoryWithProduct } = await supabase
            .from('inventory')
            .select('*, products(name, min_stock_level)')
            .eq('id', payload.new.id)
            .single();

          if (inventoryWithProduct) {
            const minLevel = inventoryWithProduct.products?.min_stock_level || 100;
            if (newQuantity <= minLevel) {
              const title = `Low Stock: ${inventoryWithProduct.products?.name}`;
              const description = `Stock level is ${newQuantity} units (min: ${minLevel})`;
              addNotification({ title, description, type: 'warning' });
              toast.warning(title, {
                description,
                icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
                duration: 8000,
              });
            }
          }
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
        { event: 'INSERT', schema: 'public', table: 'sales_orders' },
        async (payload) => {
          const { data: order } = await supabase
            .from('sales_orders')
            .select('*, customers(name)')
            .eq('id', payload.new.id)
            .single();

          if (order) {
            const title = `New Order: ${order.order_number}`;
            const description = `From ${order.customers?.name || 'Unknown'} - KES ${Number(order.total_amount).toLocaleString()}`;
            addNotification({ title, description, type: 'info' });
            toast.info(title, {
              description,
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
        { event: 'UPDATE', schema: 'public', table: 'sales_orders' },
        async (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;

          if (oldStatus !== newStatus) {
            const { data: order } = await supabase
              .from('sales_orders')
              .select('order_number')
              .eq('id', payload.new.id)
              .single();

            const title = `Order ${order?.order_number} Updated`;
            const description = `Status changed to ${newStatus}`;
            addNotification({ title, description, type: 'success' });
            toast.success(title, {
              description,
              icon: <Package className="h-4 w-4 text-primary" />,
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
        { event: 'UPDATE', schema: 'public', table: 'shipments' },
        (payload) => {
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;

          if (oldStatus !== newStatus && newStatus === 'delivered') {
            const title = 'Shipment Delivered!';
            const description = 'A shipment has been marked as delivered';
            addNotification({ title, description, type: 'success' });
            toast.success(title, {
              description,
              icon: <Truck className="h-4 w-4 text-green-500" />,
              duration: 5000,
            });
          }
          queryClient.invalidateQueries({ queryKey: ['shipments'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    // Generic realtime invalidation for additional tables
    const genericChannel = supabase
      .channel('generic-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'depots' }, () => {
        queryClient.invalidateQueries({ queryKey: ['depots'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_returns' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_incidents' }, () => {
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order-items'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(shipmentsChannel);
      supabase.removeChannel(genericChannel);
    };
  }, [queryClient, addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
