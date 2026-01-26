import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Package, Truck, DollarSign, RotateCcw, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts';
import { SugarTypeDistribution } from '@/components/dashboard/SugarTypeDistribution';
import { SalesTrendChart } from '@/components/dashboard/SalesTrendChart';
import { ReturnsOverview } from '@/components/dashboard/ReturnsOverview';
import { MonthlyPerformance } from '@/components/dashboard/MonthlyPerformance';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { formatMetricTonnesShort } from '@/lib/unit-converter';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersResult, inventoryResult, shipmentsResult, returnsResult] = await Promise.all([
        supabase.from('sales_orders').select('total_amount, status'),
        supabase.from('inventory').select('quantity'),
        supabase.from('shipments').select('status'),
        supabase.from('sales_returns').select('weight_kg, status'),
      ]);

      const orders = ordersResult.data || [];
      const inventory = inventoryResult.data || [];
      const shipments = shipmentsResult.data || [];
      const returns = returnsResult.data || [];

      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const activeShipments = shipments.filter(s => s.status !== 'delivered').length;
      const totalReturns = returns.reduce((sum, r) => sum + Number(r.weight_kg), 0);
      const pendingReturns = returns.filter(r => r.status === 'pending').length;

      return {
        totalRevenue,
        pendingOrders,
        totalOrders: orders.length,
        totalStock,
        activeShipments,
        totalReturns,
        pendingReturns,
      };
    }
  });

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <StatsCard
          title="Total Revenue"
          value={formatMetricTonnesShort(stats?.totalRevenue || 0)}
          description="in metric tonnes"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          delay={0}
        />
        <StatsCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          description={`of ${stats?.totalOrders || 0} total orders`}
          icon={ShoppingCart}
          delay={50}
        />
        <StatsCard
          title="Total Stock"
          value={formatMetricTonnesShort((stats?.totalStock || 0) * 50)}
          description="across all depots"
          icon={Package}
          delay={100}
        />
        <StatsCard
          title="Active Shipments"
          value={stats?.activeShipments || 0}
          description="in transit"
          icon={Truck}
          trend={{ value: 8.2, isPositive: true }}
          delay={150}
        />
        <StatsCard
          title="Pending Returns"
          value={stats?.pendingReturns || 0}
          description={formatMetricTonnesShort(stats?.totalReturns || 0) + ' total'}
          icon={RotateCcw}
          trend={{ value: 2.1, isPositive: false }}
          delay={200}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <SugarTypeDistribution />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesTrendChart />
        </div>
        <div>
          <ReturnsOverview />
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyPerformance />
        </div>
        <div>
          <InventoryAlerts />
        </div>
      </div>

      {/* Recent Orders */}
      <AnimatedCard delay={350}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Orders
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <RecentOrdersTable />
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );
}
