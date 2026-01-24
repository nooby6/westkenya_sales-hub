import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Shield } from 'lucide-react';

export default function Users() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {['Admin', 'Manager', 'Warehouse Staff', 'Sales Rep'].map((role) => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{role}</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Roles & Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Admin</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access to all data, dashboards, reports, and settings. Can manage users and their roles.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-chart-1" />
                <h3 className="font-semibold">Manager</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Can view all data, manage orders and inventory, generate reports. Cannot manage users.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-chart-2" />
                <h3 className="font-semibold">Warehouse Staff</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Can update inventory, manage dispatch, and track shipments. Limited access to reports.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-chart-3" />
                <h3 className="font-semibold">Sales Rep</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Can enter and update orders, view assigned customers. Read-only access to inventory.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
