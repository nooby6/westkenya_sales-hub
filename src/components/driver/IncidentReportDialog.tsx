import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

const INCIDENT_TYPES = [
  { value: 'vehicle_breakdown', label: 'Vehicle Breakdown' },
  { value: 'accident', label: 'Accident' },
  { value: 'customer_unavailable', label: 'Customer Unavailable' },
  { value: 'wrong_address', label: 'Wrong Address' },
  { value: 'product_damage', label: 'Product Damage' },
  { value: 'weather_delay', label: 'Weather Delay' },
  { value: 'road_closure', label: 'Road Closure' },
  { value: 'other', label: 'Other' },
];

interface Shipment {
  id: string;
  sales_orders: {
    order_number: string;
  } | null;
}

interface IncidentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment | null;
}

export function IncidentReportDialog({ open, onOpenChange, shipment }: IncidentReportDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');

  const reportIncidentMutation = useMutation({
    mutationFn: async () => {
      if (!shipment || !user) throw new Error('Missing data');

      const { error } = await supabase
        .from('delivery_incidents')
        .insert({
          shipment_id: shipment.id,
          reported_by: user.id,
          incident_type: incidentType,
          description: description.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-shipments'] });
      toast.success('Incident reported successfully');
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to report incident');
    },
  });

  const handleClose = () => {
    setIncidentType('');
    setDescription('');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    reportIncidentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Incident
          </DialogTitle>
          <DialogDescription>
            Report an issue with delivery {shipment?.sales_orders?.order_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-type">Incident Type</Label>
            <Select value={incidentType} onValueChange={setIncidentType}>
              <SelectTrigger id="incident-type">
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the incident in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={reportIncidentMutation.isPending}
            >
              {reportIncidentMutation.isPending ? 'Reporting...' : 'Report Incident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
