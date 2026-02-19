import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Clock, CheckCircle, Truck, ArrowRight, Navigation, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { DeliveryMap } from './DeliveryMap';
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

const nextStatusLabels: Record<ShipmentStatus, string> = {
  pending: 'Start Loading',
  loading: 'Start Delivery',
  in_transit: 'Confirm Delivered',
  delivered: '',
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

interface DeliveryCardProps {
  shipment: Shipment;
  onStatusUpdate: (shipmentId: string, currentStatus: ShipmentStatus) => void;
  onReportIncident: (shipment: Shipment) => void;
  isUpdating: boolean;
}

export function DeliveryCard({ shipment, onStatusUpdate, onReportIncident, isUpdating }: DeliveryCardProps) {
  const customerAddress = shipment.sales_orders?.customers?.address;
  const hasNextStatus = shipment.status !== 'delivered';

  const openDirections = () => {
    if (!customerAddress) return;
    const encodedAddress = encodeURIComponent(customerAddress);
    // Open Google Maps with directions
    window.open(`https://www.google.com/maps/search/${encodedAddress}`, '_blank');
  };

  const openWaze = () => {
    if (!customerAddress) return;
    const encodedAddress = encodeURIComponent(customerAddress);
    window.open(`https://www.waze.com/ul?q=${encodedAddress}&navigate=yes`, '_blank');
  };

  return (
    <Card className="overflow-hidden">
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
            <div className="flex-1">
              <p className="font-medium text-sm">
                {shipment.sales_orders?.customers?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {customerAddress || 'No address provided'}
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

        {/* Embedded Map */}
        {customerAddress && (
          <div className="space-y-2">
            <DeliveryMap address={customerAddress} customerName={shipment.sales_orders?.customers?.name} />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={openDirections}
              >
                <Navigation className="h-4 w-4" />
                Google Maps
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={openWaze}
              >
                <Navigation className="h-4 w-4" />
                Waze
              </Button>
            </div>
          </div>
        )}

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

        {/* Action Buttons */}
        <div className="space-y-2">
          {hasNextStatus && (
            <Button
              className="w-full gap-2"
              onClick={() => onStatusUpdate(shipment.id, shipment.status)}
              disabled={isUpdating}
            >
              {shipment.status === 'in_transit' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {nextStatusLabels[shipment.status]}
            </Button>
          )}
          
          {/* Report Incident Button - only show for active deliveries */}
          {hasNextStatus && (
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => onReportIncident(shipment)}
            >
              <AlertTriangle className="h-4 w-4" />
              Report Incident
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
