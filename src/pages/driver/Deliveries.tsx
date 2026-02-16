import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Package } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { DeliveryCard } from '@/components/driver/DeliveryCard';
import { IncidentReportDialog } from '@/components/driver/IncidentReportDialog';
import { queryKeys } from '@/lib/queryKeys';

type ShipmentStatus = Database['public']['Enums']['shipment_status'];

const nextStatus: Record<ShipmentStatus, ShipmentStatus | null> = {
  pending: 'loading',
  loading: 'in_transit',
  in_transit: 'delivered',
  delivered: null,
};

interface Shipment {
  id: string;
  status: ShipmentStatus;
  vehicle_number_plate: string;
  created_at: string;
  notes: string | null;
  sales_orders: {
    order_number: string;
    customers: {
      name: string;
      address: string | null;
      phone: string | null;
    } | null;
  } | null;
}

export default function DriverDeliveries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Fetch driver's profile to get their phone number
  const { data: profile } = useQuery({
    queryKey: queryKeys.profile.byUserId(user?.id || ''),
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
    queryKey: ['driver-shipments', ...queryKeys.shipments.byDriverPhone(profile?.phone || '')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          sales_orders (
            order_number,
            customers (name, address, phone)
          )
        `)
        .eq('driver_phone', profile!.phone!)
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
      // Invalidate both active and completed shipments
      if (profile?.phone) {
        queryClient.invalidateQueries({ queryKey: queryKeys.shipments.byDriverPhone(profile.phone) });
        queryClient.invalidateQueries({ queryKey: queryKeys.shipments.completedByDriver(profile.phone) });
        queryClient.invalidateQueries({ queryKey: queryKeys.driverStats.byPhone(profile.phone) });
      }
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

  const handleReportIncident = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIncidentDialogOpen(true);
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
            <DeliveryCard
              key={shipment.id}
              shipment={shipment as Shipment}
              onStatusUpdate={handleStatusUpdate}
              onReportIncident={handleReportIncident}
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}

      <IncidentReportDialog
        open={incidentDialogOpen}
        onOpenChange={setIncidentDialogOpen}
        shipment={selectedShipment}
      />
    </div>
  );
}
