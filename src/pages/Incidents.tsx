import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Truck,
  User,
  FileText,
  Filter
} from 'lucide-react';

interface Incident {
  id: string;
  shipment_id: string;
  incident_type: string;
  description: string;
  reported_at: string;
  reported_by: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

interface ShipmentWithOrder {
  id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_number_plate: string;
  order_id: string;
  sales_orders: {
    order_number: string;
    customers: {
      name: string;
    };
  };
}

const incidentTypeLabels: Record<string, string> = {
  vehicle_breakdown: 'Vehicle Breakdown',
  accident: 'Accident',
  product_damage: 'Product Damage',
  customer_unavailable: 'Customer Unavailable',
  wrong_address: 'Wrong Address',
  weather_delay: 'Weather Delay',
  other: 'Other',
};

const incidentTypeColors: Record<string, string> = {
  vehicle_breakdown: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  accident: 'bg-destructive/10 text-destructive border-destructive/20',
  product_damage: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  customer_unavailable: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  wrong_address: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  weather_delay: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  other: 'bg-muted text-muted-foreground border-border',
};

export default function Incidents() {
  const { isSupervisorOrHigher } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('delivery_incidents')
        .select('*')
        .order('reported_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.is('resolved_at', null);
      } else if (statusFilter === 'resolved') {
        query = query.not('resolved_at', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Incident[];
    },
    enabled: isSupervisorOrHigher,
  });

  const { data: shipments } = useQuery({
    queryKey: ['shipments-for-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          driver_name,
          driver_phone,
          vehicle_number_plate,
          order_id,
          sales_orders (
            order_number,
            customers (
              name
            )
          )
        `);
      if (error) throw error;
      return data as ShipmentWithOrder[];
    },
    enabled: isSupervisorOrHigher,
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('delivery_incidents')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident resolved successfully');
      setSelectedIncident(null);
      setResolutionNotes('');
    },
    onError: () => {
      toast.error('Failed to resolve incident');
    },
  });

  const getShipmentInfo = (shipmentId: string) => {
    return shipments?.find(s => s.id === shipmentId);
  };

  const pendingCount = incidents?.filter(i => !i.resolved_at).length || 0;
  const resolvedCount = incidents?.filter(i => i.resolved_at).length || 0;

  if (!isSupervisorOrHigher) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Delivery Incidents</h1>
        <p className="text-muted-foreground">Monitor and resolve delivery issues reported by drivers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Incidents</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : incidents?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2" />
              <p>No incidents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Driver</TableHead>
                    <TableHead className="hidden lg:table-cell">Order</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Reported</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents?.map((incident) => {
                    const shipment = getShipmentInfo(incident.shipment_id);
                    return (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={incidentTypeColors[incident.incident_type] || incidentTypeColors.other}
                          >
                            {incidentTypeLabels[incident.incident_type] || incident.incident_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{shipment?.driver_name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{shipment?.sales_orders?.order_number || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {incident.description}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {format(new Date(incident.reported_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          {incident.resolved_at ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!incident.resolved_at && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedIncident(incident)}
                            >
                              Resolve
                            </Button>
                          )}
                          {incident.resolved_at && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedIncident(incident)}
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve/View Dialog */}
      <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedIncident?.resolved_at ? 'Incident Details' : 'Resolve Incident'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge 
                    variant="outline" 
                    className={incidentTypeColors[selectedIncident.incident_type] || incidentTypeColors.other}
                  >
                    {incidentTypeLabels[selectedIncident.incident_type] || selectedIncident.incident_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Reported</p>
                  <p className="font-medium">
                    {format(new Date(selectedIncident.reported_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedIncident.description}</p>
              </div>

              {selectedIncident.resolved_at ? (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Resolution Notes</p>
                  <p className="text-sm bg-green-500/10 p-3 rounded-md border border-green-500/20">
                    {selectedIncident.resolution_notes || 'No notes provided'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Resolved on {format(new Date(selectedIncident.resolved_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Resolution Notes</p>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how this incident was resolved..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIncident(null)}>
              {selectedIncident?.resolved_at ? 'Close' : 'Cancel'}
            </Button>
            {selectedIncident && !selectedIncident.resolved_at && (
              <Button
                onClick={() => resolveIncidentMutation.mutate({ 
                  id: selectedIncident.id, 
                  notes: resolutionNotes 
                })}
                disabled={resolveIncidentMutation.isPending}
              >
                {resolveIncidentMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
