import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

interface EditDepotDialogProps {
  depot: Tables<'depots'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDepotDialog({ depot, open, onOpenChange }: EditDepotDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_phone: '',
    is_active: true,
  });

  useEffect(() => {
    if (depot) {
      setFormData({
        name: depot.name,
        location: depot.location,
        contact_phone: depot.contact_phone || '',
        is_active: depot.is_active ?? true,
      });
    }
  }, [depot]);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!depot) return;
      const { error } = await supabase
        .from('depots')
        .update({
          name: data.name,
          location: data.location,
          contact_phone: data.contact_phone || null,
          is_active: data.is_active,
        })
        .eq('id', depot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots'] });
      onOpenChange(false);
      toast.success('Depot updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update depot');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error('Name and location are required');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Depot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depot-name">Name</Label>
            <Input
              id="depot-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depot-location">Location</Label>
            <Input
              id="depot-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depot-phone">Contact Phone</Label>
            <Input
              id="depot-phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="Enter contact phone"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="depot-active">Active</Label>
            <Switch
              id="depot-active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
