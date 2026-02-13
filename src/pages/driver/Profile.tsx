import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Phone, Mail, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { queryKeys, driverInvalidationKeys } from '@/lib/queryKeys';

export default function DriverProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: queryKeys.profile.byUserId(user?.id || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch delivery stats
  const { data: stats } = useQuery({
    queryKey: queryKeys.driverStats.byPhone(profile?.phone || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('status')
        .eq('driver_phone', profile!.phone);

      if (error) throw error;

      const delivered = data.filter(s => s.status === 'delivered').length;
      const inProgress = data.filter(s => s.status !== 'delivered').length;
      return { total: data.length, delivered, inProgress };
    },
    enabled: !!profile?.phone,
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; phone: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user!.id);
      if (error) throw error;
      return { oldPhone: profile?.phone, newPhone: data.phone };
    },
    onSuccess: (data) => {
      // Invalidate profile cache
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUserId(user!.id) });
      
      // If phone changed, invalidate all driver-related queries
      if (data.oldPhone !== data.newPhone) {
        const driverKeys = driverInvalidationKeys.byPhone(data.oldPhone, data.newPhone);
        driverKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-foreground">My Profile</h1>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Personal Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Your phone number is used to assign deliveries to you.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{profile?.full_name}</p>
                  <Badge variant="outline">Driver</Badge>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.phone || 'Not set'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats?.delivered || 0}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{stats?.inProgress || 0}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Keep your phone updated</p>
              <p className="text-xs text-muted-foreground">
                Your deliveries are assigned based on your registered phone number. Make sure it matches the number used when creating shipments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
