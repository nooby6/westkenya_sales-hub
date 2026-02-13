import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { UserCircle, Shield, Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { queryKeys, profileInvalidationKeys } from '@/lib/queryKeys';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  created_at: string;
}

const roleColors: Record<AppRole, string> = {
  ceo: 'bg-destructive/90 text-destructive-foreground border-destructive/50 hover:bg-destructive/90',
  manager: 'bg-primary/90 text-primary-foreground border-primary/50 hover:bg-primary/90',
  supervisor: 'bg-accent text-accent-foreground border-accent/50 hover:bg-accent',
  sales_rep: 'bg-secondary text-secondary-foreground border-secondary/50 hover:bg-secondary',
  driver: 'bg-muted text-muted-foreground border-muted/50 hover:bg-muted',
};

const roleLabels: Record<AppRole, string> = {
  ceo: 'CEO',
  manager: 'Manager',
  supervisor: 'Supervisor',
  sales_rep: 'Sales Rep',
  driver: 'Driver',
};

export default function UsersPage() {
  const { canManageUsers, isCeo, role: currentUserRole } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales_rep' as AppRole,
  });

  // Fetch users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.profile.allWithRoles(),
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      return profiles.map((profile) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'sales_rep',
        } as UserWithRole;
      });
    },
    enabled: canManageUsers,
  });

  // Count users by role
  const roleCounts = users?.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    },
    {} as Record<AppRole, number>
  ) || {};

  // Create new user
  const createUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Sign up the new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Wait a moment for the trigger to create profile and default role
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the role if not sales_rep (default)
      if (data.role !== 'sales_rep') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', authData.user.id);

        if (roleError) throw roleError;
      }

      // Update profile with phone if provided
      if (data.phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: data.phone, full_name: data.fullName })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.allWithRoles() });
      setIsCreateOpen(false);
      setFormData({ fullName: '', email: '', password: '', phone: '', role: 'sales_rep' });
      toast.success('User created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      // Invalidate both the users list and the specific user's profile cache
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.allWithRoles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUserId(userId) });
      toast.success('Role updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async ({
      userId,
      fullName,
      phone,
      role,
    }: {
      userId: string;
      fullName: string;
      phone: string;
      role: AppRole;
    }) => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleError) throw roleError;
      
      return userId;
    },
    onSuccess: (userId) => {
      // Invalidate both the users list and the specific user's profile cache
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.allWithRoles() });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUserId(userId) });
      setIsEditOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateProfileMutation.mutate({
      userId: selectedUser.user_id,
      fullName: selectedUser.full_name,
      phone: selectedUser.phone || '',
      role: selectedUser.role,
    });
  };

  const openEditDialog = (user: UserWithRole) => {
    setSelectedUser({ ...user });
    setIsEditOpen(true);
  };

  // Get available roles for current user to assign
  const getAssignableRoles = (): AppRole[] => {
    if (isCeo) {
      return ['ceo', 'manager', 'supervisor', 'sales_rep', 'driver'];
    }
    // Managers can assign all roles except CEO
    return ['manager', 'supervisor', 'sales_rep', 'driver'];
  };

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only CEO and Managers can access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignableRoles = getAssignableRoles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {(['ceo', 'manager', 'supervisor', 'sales_rep', 'driver'] as AppRole[]).map((role) => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{roleLabels[role]}</p>
                  <p className="text-2xl font-bold">{roleCounts[role] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name</Label>
                <Input
                  id="edit-fullName"
                  value={selectedUser.full_name}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={selectedUser.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: AppRole) =>
                    setSelectedUser({ ...selectedUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleLabels[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={roleColors.ceo}>CEO</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Total authority. Full access to all data, users, pricing, and strategic controls. All actions are logged.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={roleColors.manager}>Manager</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                End-to-end operational control. Full reporting, inventory rules, user management (except CEO).
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={roleColors.supervisor}>Supervisor</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Operational oversight. Can edit/approve orders, adjust schedules, generate reports, manage drivers and sales reps.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={roleColors.sales_rep}>Sales Rep</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Create orders and schedule deliveries. Read-only inventory and pricing. Can export own orders.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={roleColors.driver}>Driver</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Delivery only. View assigned deliveries, update status, upload proof of delivery. No access to pricing or reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
