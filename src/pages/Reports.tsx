import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, Download, FileText, Package, Truck, TrendingUp, RotateCcw } from 'lucide-react';
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
  Legend,
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
import { formatMetricTonnes, kgToMetricTonnes, sugarTypeLabels } from '@/lib/unit-converter';

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

  const { data: returnsData } = useQuery({
    queryKey: ['returns-report', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_returns')
        .select(`
          *,
          products (name, sugar_type)
        `)
        .gte('return_date', dateFrom)
        .lte('return_date', dateTo);
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
    amount: kgToMetricTonnes(amount),
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
    // Assuming average weight per unit is 50kg for estimation
    const weightKg = item.quantity * 50;
    acc[depotName] = (acc[depotName] || 0) + weightKg;
    return acc;
  }, {});

  const inventoryChartData = Object.entries(inventoryByDepot || {}).map(([depot, weightKg]) => ({
    depot,
    quantity: kgToMetricTonnes(weightKg),
  }));

  // Sugar type distribution
  const sugarTypeData = inventoryData?.reduce((acc: Record<string, number>, item) => {
    const type = item.products?.sugar_type || 'unknown';
    const weightKg = item.quantity * 50;
    acc[type] = (acc[type] || 0) + weightKg;
    return acc;
  }, {});

  const sugarTypeChartData = Object.entries(sugarTypeData || {}).map(([type, weightKg]) => ({
    name: sugarTypeLabels[type] || type,
    value: kgToMetricTonnes(weightKg),
  }));

  // Returns by reason
  const returnsByReason = returnsData?.reduce((acc: Record<string, number>, r) => {
    acc[r.return_reason] = (acc[r.return_reason] || 0) + Number(r.weight_kg);
    return acc;
  }, {});

  const returnsChartData = Object.entries(returnsByReason || {}).map(([reason, weightKg]) => ({
    name: reason.length > 15 ? reason.slice(0, 15) + '...' : reason,
    value: kgToMetricTonnes(weightKg),
  }));

  // Summary stats - in metric tonnes
  const totalSalesKg = salesData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
  const totalSalesMT = kgToMetricTonnes(totalSalesKg);
  const totalOrders = salesData?.length || 0;
  const avgOrderValueMT = totalOrders > 0 ? totalSalesMT / totalOrders : 0;
  const totalReturnsKg = returnsData?.reduce((sum, r) => sum + Number(r.weight_kg), 0) || 0;
  const totalReturnsMT = kgToMetricTonnes(totalReturnsKg);

  const handleExportCSV = () => {
    if (!salesData || salesData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    const headers = ['Order Number', 'Customer', 'Depot', 'Amount (MT)', 'Status', 'Date'];
    const rows = salesData.map(order => [
      order.order_number,
      order.customers?.name || '',
      order.depots?.name || '',
      kgToMetricTonnes(Number(order.total_amount)).toFixed(2),
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">Generate and export business reports (Metric Tonnes)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="transition-all duration-300 hover:scale-105">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF('orders')} className="transition-all duration-300 hover:scale-105">
            <FileText className="h-4 w-4 mr-2" />
            Orders PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF('inventory')} className="transition-all duration-300 hover:scale-105">
            <Package className="h-4 w-4 mr-2" />
            Inventory PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportPDF('shipments')} className="transition-all duration-300 hover:scale-105">
            <Truck className="h-4 w-4 mr-2" />
            Shipments PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <AnimatedCard delay={50}>
        <AnimatedCardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[180px] transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="shipments">Shipment Report</SelectItem>
                  <SelectItem value="returns">Returns Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[180px] transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[180px] transition-all duration-300"
              />
            </div>
          </div>
        </AnimatedCardContent>
      </AnimatedCard>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <AnimatedCard delay={100}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center group">
              <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2 transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">
                {totalSalesMT.toFixed(2)} MT
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={150}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center group">
              <div className="inline-flex p-3 rounded-full bg-chart-2/20 mb-2 transition-transform duration-300 group-hover:scale-110">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={200}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center group">
              <div className="inline-flex p-3 rounded-full bg-chart-3/20 mb-2 transition-transform duration-300 group-hover:scale-110">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold text-foreground">
                {avgOrderValueMT.toFixed(2)} MT
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={250}>
          <AnimatedCardContent className="pt-6">
            <div className="text-center group">
              <div className="inline-flex p-3 rounded-full bg-destructive/10 mb-2 transition-transform duration-300 group-hover:scale-110">
                <RotateCcw className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Total Returns</p>
              <p className="text-2xl font-bold text-foreground">
                {totalReturnsMT.toFixed(2)} MT
              </p>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnimatedCard delay={300}>
          <AnimatedCardHeader>
            <AnimatedCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Sales Over Time (Metric Tonnes)
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
                  tickFormatter={(value) => `${value.toFixed(0)} MT`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  strokeWidth={2}
                  animationBegin={0}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={350}>
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
                  animationBegin={0}
                  animationDuration={1200}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusChartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={400}>
          <AnimatedCardHeader>
            <AnimatedCardTitle>Sugar Type Distribution (Metric Tonnes)</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sugarTypeChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1200}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)} MT`}
                  labelLine={true}
                >
                  {sugarTypeChartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Weight']}
                />
              </PieChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={450}>
          <AnimatedCardHeader>
            <AnimatedCardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-destructive" />
              Returns by Reason (Metric Tonnes)
            </AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={returnsChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(1)} MT`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Returns']}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--destructive))" 
                  radius={[0, 4, 4, 0]}
                  animationBegin={0}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={500} className="lg:col-span-2">
          <AnimatedCardHeader>
            <AnimatedCardTitle>Inventory by Depot (Metric Tonnes)</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inventoryChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(0)} MT`}
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
                  dataKey="quantity" 
                  fill="hsl(var(--chart-2))" 
                  radius={[0, 4, 4, 0]}
                  animationBegin={0}
                  animationDuration={1200}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* AI Insights */}
      <AISuggestionsPanel />
    </div>
  );
}
