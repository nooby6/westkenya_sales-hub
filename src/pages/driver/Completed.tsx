import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, CheckCircle, Truck, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function DriverCompleted() {
  const { user } = useAuth();

  // Fetch driver's profile
  const { data: profile } = useQuery({
    queryKey: ['driver-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch completed deliveries
  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['driver-completed', profile?.phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          sales_orders (
            order_number,
            customers (name, address)
          )
        `)
        .eq('driver_phone', profile!.phone!)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.phone,
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Completed Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          {deliveries?.length || 0} deliveries completed
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !deliveries || deliveries.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Completed Deliveries</h2>
            <p className="text-muted-foreground">
              Your completed deliveries will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <Card key={delivery.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{delivery.sales_orders?.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {delivery.sales_orders?.customers?.name}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Delivered
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {delivery.delivered_at && format(new Date(delivery.delivered_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {delivery.vehicle_number_plate}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
