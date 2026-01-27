import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  RotateCcw, 
  Plus, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ProgressRing } from '@/components/ui/progress-ring';

const RETURN_REASONS = [
  'Damaged packaging',
  'Quality issues',
  'Wrong product delivered',
  'Expired product',
  'Customer changed mind',
  'Overstock',
  'Other',
];

const SUGAR_TYPES = [
  { value: 'bale_2x10', label: 'Bale 2×10', weightKg: 20 },
  { value: 'bale_1x20', label: 'Bale 1×20', weightKg: 20 },
  { value: 'bale_1x12', label: 'Bale 1×12', weightKg: 12 },
  { value: 'bag_50kg', label: 'Bag 50kg', weightKg: 50 },
  { value: 'bag_25kg', label: 'Bag 25kg', weightKg: 25 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--destructive))'];

export default function SalesReturns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    order_id: '',
    product_id: '',
    quantity: 1,
    weight_kg: 0,
    return_reason: '',
    notes: '',
  });

  // Fetch returns data
  const { data: returns, isLoading } = useQuery({
    queryKey: ['sales-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_returns')
        .select(`
          *,
          sales_orders (order_number, customers (name)),
          products (name, sku, sugar_type)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Fetch orders for dropdown
  const { data: orders } = useQuery({
    queryKey: ['orders-for-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('id, order_number, customer_id, customers (name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products-for-returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, sugar_type')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  // Create return mutation
  const createReturn = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('sales_returns').insert({
        ...data,
        processed_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success('Return recorded successfully');
      setIsDialogOpen(false);
      setFormData({
        order_id: '',
        product_id: '',
        quantity: 1,
        weight_kg: 0,
        return_reason: '',
        notes: '',
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to record return: ${error.message}`);
    }
  });

  // Update return status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('sales_returns')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success('Status updated');
    }
  });

  // Calculate statistics
  const totalReturnsKg = returns?.reduce((sum, r) => sum + Number(r.weight_kg), 0) || 0;
  const totalReturnsMT = totalReturnsKg / 1000;
  const pendingReturns = returns?.filter(r => r.status === 'pending').length || 0;
  const processedReturns = returns?.filter(r => r.status === 'processed').length || 0;

  // Returns by reason for pie chart
  const returnsByReason = returns?.reduce((acc: Record<string, number>, r) => {
    acc[r.return_reason] = (acc[r.return_reason] || 0) + 1;
    return acc;
  }, {});

  const reasonChartData = Object.entries(returnsByReason || {}).map(([reason, count]) => ({
    name: reason,
    value: count,
  }));

  // Returns by product type
  const returnsByProduct = returns?.reduce((acc: Record<string, number>, r) => {
    const productName = r.products?.name || 'Unknown';
    acc[productName] = (acc[productName] || 0) + Number(r.weight_kg) / 1000;
    return acc;
  }, {});

  const productChartData = Object.entries(returnsByProduct || {})
    .map(([product, weightMT]) => ({
      product,
      weightMT: Number(weightMT.toFixed(2)),
    }))
    .sort((a, b) => b.weightMT - a.weightMT)
    .slice(0, 6);

  // Returns trend over time
  const returnsTrend = returns?.reduce((acc: Record<string, number>, r) => {
    const date = format(new Date(r.return_date), 'MMM dd');
    acc[date] = (acc[date] || 0) + Number(r.weight_kg) / 1000;
    return acc;
  }, {});

  const trendChartData = Object.entries(returnsTrend || {})
    .map(([date, weightMT]) => ({
      date,
      weightMT: Number(weightMT.toFixed(2)),
    }))
    .slice(-14);

  const handleProductChange = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    const sugarType = SUGAR_TYPES.find(t => t.value === product?.sugar_type);
    setFormData(prev => ({
      ...prev,
      product_id: productId,
      weight_kg: sugarType ? sugarType.weightKg * prev.quantity : 0,
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    const product = products?.find(p => p.id === formData.product_id);
    const sugarType = SUGAR_TYPES.find(t => t.value === product?.sugar_type);
    setFormData(prev => ({
      ...prev,
      quantity,
      weight_kg: sugarType ? sugarType.weightKg * quantity : 0,
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'processed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Returns</h1>
          <p className="text-muted-foreground">Track and manage product returns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 btn-press hover-lift">
              <Plus className="h-4 w-4" />
              Record Return
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] animate-scale-in">
            <DialogHeader>
              <DialogTitle>Record Sales Return</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createReturn.mutate(formData);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Order</Label>
                <Select
                  value={formData.order_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, order_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders?.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.customers?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={handleProductChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity (Units)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Return Reason</Label>
                <Select
                  value={formData.return_reason}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, return_reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details about the return..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReturn.isPending}>
                  {createReturn.isPending ? 'Recording...' : 'Record Return'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnimatedCard delay={0}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={totalReturnsMT} decimals={2} suffix=" MT" />
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center animate-bounce-in">
                <RotateCcw className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Returns</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={pendingReturns} />
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedCounter value={processedReturns} />
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing Rate</p>
                <ProgressRing 
                  value={returns?.length ? (processedReturns / returns.length) * 100 : 0}
                  size={60}
                  color="primary"
                />
              </div>
              <div className="h-12 w-12 rounded-full bg-chart-2/20 flex items-center justify-center">
                <Scale className="h-6 w-6 text-chart-2" />
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AnimatedCard delay={400} className="lg:col-span-2">
          <AnimatedCardHeader>
            <AnimatedCardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Returns Trend (Metric Tonnes)
            </AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
                  tickFormatter={(value) => `${value} MT`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Returns']}
                />
                <Area
                  type="monotone"
                  dataKey="weightMT"
                  stroke="hsl(var(--destructive))"
                  fillOpacity={1}
                  fill="url(#colorReturns)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>

        <AnimatedCard delay={500}>
          <AnimatedCardHeader>
            <AnimatedCardTitle>Returns by Reason</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reasonChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  animationBegin={0}
                  animationDuration={1200}
                >
                  {reasonChartData.map((_, index) => (
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

        <AnimatedCard delay={600} className="lg:col-span-3">
          <AnimatedCardHeader>
            <AnimatedCardTitle>Returns by Product (Metric Tonnes)</AnimatedCardTitle>
          </AnimatedCardHeader>
          <AnimatedCardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value} MT`}
                />
                <YAxis
                  type="category"
                  dataKey="product"
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
                  formatter={(value: number) => [`${value.toFixed(2)} MT`, 'Returns']}
                />
                <Bar 
                  dataKey="weightMT" 
                  fill="hsl(var(--chart-3))" 
                  radius={[0, 4, 4, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Returns Table */}
      <AnimatedCard delay={700}>
        <AnimatedCardHeader>
          <AnimatedCardTitle>Recent Returns</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full shimmer rounded" />
              ))}
            </div>
          ) : !returns || returns.length === 0 ? (
            <div className="text-center py-12">
              <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin-slow" />
              <p className="text-muted-foreground">No returns recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weight (MT)</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnItem, index) => (
                    <TableRow 
                      key={returnItem.id}
                      className="animate-fade-in hover-lift"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">
                        {returnItem.sales_orders?.order_number}
                      </TableCell>
                      <TableCell>
                        {returnItem.sales_orders?.customers?.name}
                      </TableCell>
                      <TableCell>{returnItem.products?.name}</TableCell>
                      <TableCell>{returnItem.quantity}</TableCell>
                      <TableCell>{(Number(returnItem.weight_kg) / 1000).toFixed(3)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{returnItem.return_reason}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(returnItem.return_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(returnItem.status)}>
                          {returnItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={returnItem.status}
                          onValueChange={(value) => 
                            updateStatus.mutate({ id: returnItem.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );
}
