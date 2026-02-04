import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Package, Clock, CheckCircle, Truck, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ShipmentStatus = Database['public']['Enums']['shipment_status'];

const statusColors: Record<ShipmentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  loading: 'bg-blue-100 text-blue-800 border-blue-200',
  in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels: Record<ShipmentStatus, string> = {
  pending: 'Pending',
  loading: 'Loading',
  in_transit: 'In Transit',
  delivered: 'Delivered',
};

const nextStatus: Record<ShipmentStatus, ShipmentStatus | null> = {
  pending: 'loading',
  loading: 'in_transit',
  in_transit: 'delivered',
  delivered: null,
};

const nextStatusLabels: Record<ShipmentStatus, string> = {
  pending: 'Start Loading',
  loading: 'Start Delivery',
  in_transit: 'Mark Delivered',
  delivered: '',
};

export default function DriverDeliveries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch driver's profile to get their phone number
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

  // Fetch shipments assigned to this driver (by phone match)
  const { data: shipments, isLoading } = useQuery({
    queryKey: ['driver-shipments', profile?.phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          sales_orders!inner (
            order_number,
            customers (name, address, phone)
          )
        `)
        .eq('driver_phone', profile!.phone)
        .neq('status', 'delivered')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.phone,
  });

  // Update shipment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShipmentStatus }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'in_transit') {
        updates.dispatched_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('shipments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-shipments'] });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const handleStatusUpdate = (shipmentId: string, currentStatus: ShipmentStatus) => {
    const next = nextStatus[currentStatus];
    if (next) {
      updateStatusMutation.mutate({ id: shipmentId, status: next });
    }
  };

  if (!profile?.phone) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Phone Required</h2>
            <p className="text-muted-foreground">
              Please update your profile with your phone number to view assigned deliveries.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Deliveries</h1>
        <p className="text-sm text-muted-foreground">
          {shipments?.length || 0} active deliveries
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : !shipments || shipments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Active Deliveries</h2>
            <p className="text-muted-foreground">
              You don't have any pending deliveries at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => (
            <Card key={shipment.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {shipment.sales_orders?.order_number}
                  </CardTitle>
                  <Badge className={statusColors[shipment.status]}>
                    {statusLabels[shipment.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {shipment.sales_orders?.customers?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {shipment.sales_orders?.customers?.address || 'No address provided'}
                      </p>
                    </div>
                  </div>
                  {shipment.sales_orders?.customers?.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Phone:</span>
                      <a 
                        href={`tel:${shipment.sales_orders.customers.phone}`}
                        className="text-primary font-medium"
                      >
                        {shipment.sales_orders.customers.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Vehicle Info */}
                <div className="flex items-center gap-4 text-sm border-t pt-3">
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>{shipment.vehicle_number_plate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(shipment.created_at), 'MMM dd, HH:mm')}</span>
                  </div>
                </div>

                {/* Notes */}
                {shipment.notes && (
                  <div className="text-sm bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground">{shipment.notes}</p>
                  </div>
                )}

                {/* Action Button */}
                {nextStatus[shipment.status] && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleStatusUpdate(shipment.id, shipment.status)}
                    disabled={updateStatusMutation.isPending}
                  >
                    {shipment.status === 'in_transit' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {nextStatusLabels[shipment.status]}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
