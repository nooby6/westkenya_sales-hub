import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Package, Truck, DollarSign } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersResult, inventoryResult, shipmentsResult] = await Promise.all([
        supabase.from('sales_orders').select('total_amount, status'),
        supabase.from('inventory').select('quantity'),
        supabase.from('shipments').select('status'),
      ]);

      const orders = ordersResult.data || [];
      const inventory = inventoryResult.data || [];
      const shipments = shipmentsResult.data || [];

      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const activeShipments = shipments.filter(s => s.status !== 'delivered').length;

      return {
        totalRevenue,
        pendingOrders,
        totalOrders: orders.length,
        totalStock,
        activeShipments,
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`KES ${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          description={`of ${stats?.totalOrders || 0} total orders`}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Total Stock"
          value={`${((stats?.totalStock || 0) / 1000).toFixed(1)}K`}
          description="units across all depots"
          icon={Package}
        />
        <StatsCard
          title="Active Shipments"
          value={stats?.activeShipments || 0}
          description="in transit"
          icon={Truck}
          trend={{ value: 8.2, isPositive: true }}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <InventoryAlerts />
        </div>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable />
        </CardContent>
      </Card>
    </div>
  );
}
