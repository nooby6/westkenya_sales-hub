import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Plus, Search, Package } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  loading: 'bg-blue-100 text-blue-800 border-blue-200',
  in_transit: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
};

export default function Shipments() {
  const { user, canManageInventory } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['shipments', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('shipments')
        .select(`
          *,
          sales_orders (order_number, total_amount, customers (name))
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as "pending" | "loading" | "in_transit" | "delivered");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: dispatchableOrders } = useQuery({
    queryKey: ['dispatchable-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers (name)
        `)
        .in('status', ['confirmed', 'processing']);
      if (error) throw error;
      return data;
    }
  });

  const createShipmentMutation = useMutation({
    mutationFn: async (shipmentData: {
      order_id: string;
      driver_name: string;
      driver_id_number: string;
      driver_phone: string;
      vehicle_number_plate: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('shipments')
        .insert({
          ...shipmentData,
          created_by: user!.id,
          status: 'pending',
        });
      if (error) throw error;

      // Update order status to dispatched
      await supabase
        .from('sales_orders')
        .update({ status: 'dispatched' })
        .eq('id', shipmentData.order_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['dispatchable-orders'] });
      setIsCreateOpen(false);
      toast.success('Shipment created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create shipment: ' + error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, orderId }: { id: string; status: string; orderId: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'in_transit') {
        updateData.dispatched_at = new Date().toISOString();
      }
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
        await supabase
          .from('sales_orders')
          .update({ status: 'delivered' })
          .eq('id', orderId);
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Shipment status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const handleCreateShipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createShipmentMutation.mutate({
      order_id: formData.get('order_id') as string,
      driver_name: formData.get('driver_name') as string,
      driver_id_number: formData.get('driver_id_number') as string,
      driver_phone: formData.get('driver_phone') as string,
      vehicle_number_plate: formData.get('vehicle_number_plate') as string,
      notes: formData.get('notes') as string,
    });
  };

  const filteredShipments = shipments?.filter(shipment =>
    shipment.driver_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.vehicle_number_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.sales_orders?.order_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeShipments = shipments?.filter(s => s.status !== 'delivered').length || 0;
  const deliveredToday = shipments?.filter(s => 
    s.status === 'delivered' && 
    s.delivered_at && 
    new Date(s.delivered_at).toDateString() === new Date().toDateString()
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shipments & Delivery</h1>
          <p className="text-muted-foreground">Track and manage all shipments</p>
        </div>
        {canManageInventory && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Shipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Shipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateShipment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Select name="order_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select order to dispatch" />
                    </SelectTrigger>
                    <SelectContent>
                      {dispatchableOrders?.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_number} - {order.customers?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Driver Name</Label>
                    <Input name="driver_name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver Phone</Label>
                    <Input name="driver_phone" placeholder="+254 700 000 000" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Driver ID Number</Label>
                    <Input name="driver_id_number" placeholder="12345678" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Number Plate</Label>
                    <Input name="vehicle_number_plate" placeholder="KAA 123X" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea name="notes" placeholder="Special delivery instructions..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createShipmentMutation.isPending}>
                    {createShipmentMutation.isPending ? 'Creating...' : 'Create Shipment'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Shipments</p>
                <p className="text-2xl font-bold">{activeShipments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-chart-1/10 p-3">
                <Package className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivered Today</p>
                <p className="text-2xl font-bold">{deliveredToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-chart-2/10 p-3">
                <Truck className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Shipments</p>
                <p className="text-2xl font-bold">{shipments?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="loading">Loading</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shipments List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredShipments || filteredShipments.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No shipments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispatched</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.sales_orders?.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.driver_name}</p>
                        <p className="text-xs text-muted-foreground">{shipment.driver_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{shipment.vehicle_number_plate}</TableCell>
                    <TableCell>{shipment.sales_orders?.customers?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[shipment.status]}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {shipment.dispatched_at
                        ? format(new Date(shipment.dispatched_at), 'MMM dd, HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {canManageInventory && shipment.status !== 'delivered' && (
                        <Select
                          value={shipment.status}
                          onValueChange={(status) => updateStatusMutation.mutate({
                            id: shipment.id,
                            status,
                            orderId: shipment.order_id
                          })}
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="loading">Loading</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
