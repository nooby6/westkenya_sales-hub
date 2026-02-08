import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Package, Truck, DollarSign, TrendingUp, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { InventoryAlerts } from '@/components/dashboard/InventoryAlerts';
import { CustomerGrowthChart } from '@/components/dashboard/CustomerGrowthChart';
import { RevenueByProductChart } from '@/components/dashboard/RevenueByProductChart';
import { ShipmentTrendsChart } from '@/components/dashboard/ShipmentTrendsChart';
import { 
  AnimatedCard, 
  AnimatedCardContent, 
  AnimatedCardHeader, 
  AnimatedCardTitle 
} from '@/components/ui/animated-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [ordersResult, inventoryResult, shipmentsResult, returnsResult] = await Promise.all([
        supabase.from('sales_orders').select('total_amount, status'),
        supabase.from('inventory').select('quantity, products (name, sugar_type)'),
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
      const totalReturnsKg = returns.reduce((sum, r) => sum + Number(r.weight_kg), 0);

      // Calculate stock by sugar type
      const stockBySugarType = inventory.reduce((acc: Record<string, number>, item: any) => {
        const sugarType = item.products?.sugar_type || 'unknown';
        acc[sugarType] = (acc[sugarType] || 0) + item.quantity;
        return acc;
      }, {});

      // Order status distribution
      const ordersByStatus = orders.reduce((acc: Record<string, number>, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalRevenue,
        pendingOrders,
        totalOrders: orders.length,
        totalStock,
        totalStockMT: totalStock / 1000, // Convert to metric tonnes
        activeShipments,
        totalReturnsKg,
        totalReturnsMT: totalReturnsKg / 1000,
        stockBySugarType,
        ordersByStatus,
        deliveredShipments: shipments.filter(s => s.status === 'delivered').length,
        totalShipments: shipments.length,
      };
    }
  });

  // Prepare chart data
  const sugarTypeLabels: Record<string, string> = {
    bale_2x10: 'Bale 2×10',
    bale_1x20: 'Bale 1×20',
    bale_1x12: 'Bale 1×12',
    bag_50kg: 'Bag 50kg',
    bag_25kg: 'Bag 25kg',
    unknown: 'Other',
  };

  const stockChartData = Object.entries(stats?.stockBySugarType || {}).map(([type, qty]) => ({
    name: sugarTypeLabels[type] || type,
    value: Number(qty),
    valueMT: Number(qty) / 1000,
  }));

  const statusChartData = Object.entries(stats?.ordersByStatus || {}).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  const deliveryRate = stats?.totalShipments 
    ? (stats.deliveredShipments / stats.totalShipments) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/reports" className="block">
          <StatsCard
            title="Total Revenue"
            value=""
            numericValue={stats?.totalRevenue || 0}
            prefix="KES "
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            delay={0}
          />
        </Link>
        <Link to="/orders" className="block">
          <StatsCard
            title="Pending Orders"
            value=""
            numericValue={stats?.pendingOrders || 0}
            description={`of ${stats?.totalOrders || 0} total orders`}
            icon={ShoppingCart}
            delay={100}
          />
        </Link>
        <Link to="/inventory" className="block">
          <StatsCard
            title="Total Stock"
            value=""
            numericValue={stats?.totalStockMT || 0}
            suffix=" MT"
            decimals={1}
            description="across all depots"
            icon={Package}
            delay={200}
          />
        </Link>
        <Link to="/shipments" className="block">
          <StatsCard
            title="Active Shipments"
            value=""
            numericValue={stats?.activeShipments || 0}
            description="in transit"
            icon={Truck}
            trend={{ value: 8.2, isPositive: true }}
            delay={300}
          />
        </Link>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/sales-returns" className="block">
          <AnimatedCard delay={400}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Returns This Period</p>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedCounter value={stats?.totalReturnsMT || 0} decimals={2} suffix=" MT" />
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse-glow">
                  <RotateCcw className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </Link>

        <Link to="/shipments" className="block">
          <AnimatedCard delay={500}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Success Rate</p>
                  <div className="mt-2">
                    <ProgressRing value={deliveryRate} size={70} color="chart-2" />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-chart-2/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-chart-2" />
                </div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </Link>

        <Link to="/orders" className="block">
          <AnimatedCard delay={600}>
            <AnimatedCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Completion</p>
                  <div className="mt-2">
                    <ProgressRing 
                      value={stats?.totalOrders ? ((stats.totalOrders - stats.pendingOrders) / stats.totalOrders) * 100 : 0} 
                      size={70} 
                      color="primary" 
                    />
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </AnimatedCardContent>
          </AnimatedCard>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <AnimatedCard delay={700}>
          <AnimatedCardHeader>
            <AnimatedCardTitle>Stock by Sugar Type (MT)</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stockChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="valueMT"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  animationBegin={0}
                  animationDuration={1200}
                >
                  {stockChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Stock']}
                />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Order Status & Inventory Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedCard delay={800}>
          <AnimatedCardHeader>
            <AnimatedCardTitle>Order Status Distribution</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="status" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <div className="animate-fade-in" style={{ animationDelay: '900ms' }}>
          <InventoryAlerts />
        </div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CustomerGrowthChart />
        <RevenueByProductChart />
        <ShipmentTrendsChart />
      </div>

      {/* Recent Orders */}
      <AnimatedCard delay={1000}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold">Recent Orders</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          <RecentOrdersTable />
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );
}
