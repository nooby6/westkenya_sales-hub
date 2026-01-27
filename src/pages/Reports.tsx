import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, Download, FileText, Package, Truck, TrendingUp, Scale } from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';
import {
  generateOrdersPDF,
  generateInventoryPDF,
  generateShipmentsPDF,
  downloadPDF,
} from '@/lib/pdf-generator';
import { AISuggestionsPanel } from '@/components/ai/AISuggestionsPanel';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Reports() {
  const [reportType, setReportType] = useState<string>('sales');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: salesData } = useQuery({
    queryKey: ['sales-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers (name),
          depots (name)
        `)
        .gte('order_date', dateFrom)
        .lte('order_date', dateTo)
        .order('order_date', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          products (name, sku, unit_price, sugar_type),
          depots (name)
        `);
      if (error) throw error;
      return data;
    }
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ['shipments-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          sales_orders (order_number, customers (name))
        `)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Process data for charts - convert to metric tonnes
  const salesByDate = salesData?.reduce((acc: Record<string, number>, order) => {
    const date = format(new Date(order.order_date), 'MMM dd');
    acc[date] = (acc[date] || 0) + Number(order.total_amount);
    return acc;
  }, {});

  const salesChartData = Object.entries(salesByDate || {}).map(([date, amount]) => ({
    date,
    amount,
  }));

  const salesByStatus = salesData?.reduce((acc: Record<string, number>, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(salesByStatus || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  // Inventory by depot - convert to metric tonnes
  const inventoryByDepot = inventoryData?.reduce((acc: Record<string, number>, item) => {
    const depotName = item.depots?.name || 'Unknown';
    acc[depotName] = (acc[depotName] || 0) + item.quantity;
    return acc;
  }, {});

  const inventoryChartData = Object.entries(inventoryByDepot || {}).map(([depot, quantity]) => ({
    depot,
    quantity,
    quantityMT: quantity / 1000, // Convert kg to metric tonnes
  }));

  // Inventory by sugar type
  const inventoryBySugarType = inventoryData?.reduce((acc: Record<string, number>, item: any) => {
    const sugarType = item.products?.sugar_type || 'unknown';
    acc[sugarType] = (acc[sugarType] || 0) + item.quantity;
    return acc;
  }, {});

  const sugarTypeLabels: Record<string, string> = {
    bale_2x10: 'Bale 2×10',
    bale_1x20: 'Bale 1×20',
    bale_1x12: 'Bale 1×12',
    bag_50kg: 'Bag 50kg',
    bag_25kg: 'Bag 25kg',
    unknown: 'Other',
  };

  const sugarTypeChartData = Object.entries(inventoryBySugarType || {}).map(([type, qty]) => ({
    name: sugarTypeLabels[type] || type,
    value: Number(qty),
    valueMT: Number(qty) / 1000,
  }));

  // Summary stats
  const totalSales = salesData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  const totalOrders = salesData?.length || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalInventoryKg = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalInventoryMT = totalInventoryKg / 1000;

  const handleExportCSV = () => {
    if (!salesData || salesData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = ['Order Number', 'Customer', 'Depot', 'Amount', 'Status', 'Date'];
    const rows = salesData.map(order => [
      order.order_number,
      order.customers?.name || '',
      order.depots?.name || '',
      order.total_amount,
      order.status,
      order.order_date,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    
    toast.success('CSV report downloaded');
  };

  const handleExportPDF = (type: 'orders' | 'inventory' | 'shipments') => {
    const dateRange = { from: dateFrom, to: dateTo };
    
    try {
      if (type === 'orders') {
        if (!salesData || salesData.length === 0) {
          toast.error('No orders data to export');
          return;
        }
        const doc = generateOrdersPDF(salesData as any, dateRange);
        downloadPDF(doc, `orders-report-${dateFrom}-to-${dateTo}.pdf`);
      } else if (type === 'inventory') {
        if (!inventoryData || inventoryData.length === 0) {
          toast.error('No inventory data to export');
          return;
        }
        const doc = generateInventoryPDF(inventoryData as any);
        downloadPDF(doc, `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      } else if (type === 'shipments') {
        if (!shipmentsData || shipmentsData.length === 0) {
          toast.error('No shipments data to export');
          return;
        }
        const doc = generateShipmentsPDF(shipmentsData as any, dateRange);
        downloadPDF(doc, `shipments-report-${dateFrom}-to-${dateTo}.pdf`);
      }
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} PDF report downloaded`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export business reports</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="btn-press hover-lift">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF('orders')} className="btn-press hover-lift">
            <FileText className="h-4 w-4 mr-2" />
            Orders PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF('inventory')} className="btn-press hover-lift">
            <Package className="h-4 w-4 mr-2" />
            Inventory PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF('shipments')} className="btn-press hover-lift">
            <Truck className="h-4 w-4 mr-2" />
            Shipments PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatedCard delay={100}>
        <AnimatedCardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="shipments">Shipment Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[180px]"
              />
            </div>
          </div>
        </AnimatedCardContent>
      </AnimatedCard>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <AnimatedCard delay={200}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={totalSales} prefix="KES " />
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={300}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={totalOrders} />
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average Order Value</p>
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={avgOrderValue} prefix="KES " />
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={500}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Scale className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Total Inventory</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={totalInventoryMT} decimals={2} suffix=" MT" />
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedCard delay={600}>
          <AnimatedCardHeader>
            <AnimatedCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sales Over Time
            </AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone"
                  dataKey="amount" 
                  stroke="hsl(var(--primary))"
                  fill="url(#colorAmount)"
                  strokeWidth={2}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={700}>
          <AnimatedCardHeader>
            <AnimatedCardTitle>Order Status Distribution</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  animationBegin={0}
                  animationDuration={1200}
                >
                  {statusChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={800}>
          <AnimatedCardHeader>
            <AnimatedCardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Inventory by Depot (Metric Tonnes)
            </AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(1)} MT`}
                />
                <YAxis
                  type="category"
                  dataKey="depot"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Stock']}
                />
                <Bar 
                  dataKey="quantityMT" 
                  fill="hsl(var(--chart-2))" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={900}>
          <AnimatedCardHeader>
            <AnimatedCardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock by Sugar Type (Metric Tonnes)
            </AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sugarTypeChartData}
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
                  {sugarTypeChartData.map((_, index) => (
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

      {/* AI Insights */}
      <div className="animate-fade-in" style={{ animationDelay: '1000ms', animationFillMode: 'forwards', opacity: 0 }}>
        <AISuggestionsPanel />
      </div>
    </div>
  );
}
