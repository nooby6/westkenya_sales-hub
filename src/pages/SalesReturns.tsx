import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { RotateCcw, Plus, Search, Filter, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatMetricTonnes } from '@/lib/unit-converter';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const RETURN_REASONS = [
  'Damaged packaging',
  'Quality issues',
  'Wrong product delivered',
  'Quantity mismatch',
  'Customer cancelled order',
  'Expired product',
  'Transportation damage',
  'Other',
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  processed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function SalesReturns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newReturn, setNewReturn] = useState({
    order_id: '',
    product_id: '',
    quantity: 1,
    weight_kg: 0,
    return_reason: '',
    notes: '',
  });

  const { data: returns, isLoading } = useQuery({
    queryKey: ['sales-returns', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('sales_returns')
        .select(`
          *,
          sales_orders(order_number, customers(name)),
          products(name, sugar_type)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: orders } = useQuery({
    queryKey: ['orders-for-returns'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sales_orders')
        .select('id, order_number, customers(name)')
        .in('status', ['delivered', 'dispatched'])
        .order('order_date', { ascending: false });
      return data || [];
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-returns'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sugar_type')
        .eq('is_active', true);
      return data || [];
    }
  });

  const createReturnMutation = useMutation({
    mutationFn: async (data: typeof newReturn) => {
      const { error } = await supabase.from('sales_returns').insert([{
        ...data,
        processed_by: null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success('Return recorded successfully');
      setIsAddDialogOpen(false);
      setNewReturn({
        order_id: '',
        product_id: '',
        quantity: 1,
        weight_kg: 0,
        return_reason: '',
        notes: '',
      });
    },
    onError: (error) => {
      toast.error('Failed to record return: ' + error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'processed') {
        updateData.processed_by = user?.id;
      }
      const { error } = await supabase
        .from('sales_returns')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success('Return status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const filteredReturns = returns?.filter(r => {
    if (!search) return true;
    const orderNumber = r.sales_orders?.order_number?.toLowerCase() || '';
    const customerName = r.sales_orders?.customers?.name?.toLowerCase() || '';
    const productName = r.products?.name?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    return orderNumber.includes(searchLower) || 
           customerName.includes(searchLower) || 
           productName.includes(searchLower);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-destructive" />
            Sales Returns
          </h1>
          <p className="text-muted-foreground">Track and manage product returns</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 transition-all duration-300 hover:scale-105">
              <Plus className="h-4 w-4" />
              Record Return
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] animate-scale-in">
            <DialogHeader>
              <DialogTitle>Record New Return</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Order</Label>
                <Select 
                  value={newReturn.order_id} 
                  onValueChange={(v) => setNewReturn(prev => ({ ...prev, order_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders?.map(order => (
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
                  value={newReturn.product_id} 
                  onValueChange={(v) => setNewReturn(prev => ({ ...prev, product_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={newReturn.quantity}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.1"
                    value={newReturn.weight_kg}
                    onChange={(e) => setNewReturn(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Return Reason</Label>
                <Select 
                  value={newReturn.return_reason} 
                  onValueChange={(v) => setNewReturn(prev => ({ ...prev, return_reason: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {RETURN_REASONS.map(reason => (
                      <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea 
                  value={newReturn.notes}
                  onChange={(e) => setNewReturn(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details about the return..."
                />
              </div>
              <Button 
                className="w-full transition-all duration-300"
                onClick={() => createReturnMutation.mutate(newReturn)}
                disabled={!newReturn.order_id || !newReturn.product_id || !newReturn.return_reason || createReturnMutation.isPending}
              >
                {createReturnMutation.isPending ? 'Recording...' : 'Record Return'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <AnimatedCard delay={100}>
        <AnimatedCardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by order, customer, or product..."
                className="pl-9 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AnimatedCardContent>
      </AnimatedCard>

      {/* Returns Table */}
      <AnimatedCard delay={200}>
        <AnimatedCardHeader>
          <AnimatedCardTitle className="text-lg font-semibold">
            Returns History
          </AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns?.map((ret, index) => (
                    <TableRow 
                      key={ret.id}
                      className="animate-fade-in transition-colors hover:bg-muted/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">{ret.sales_orders?.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {ret.sales_orders?.customers?.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{ret.products?.name}</TableCell>
                      <TableCell>{ret.quantity}</TableCell>
                      <TableCell>{formatMetricTonnes(ret.weight_kg)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{ret.return_reason}</span>
                      </TableCell>
                      <TableCell>{format(new Date(ret.return_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[ret.status]}>
                          {ret.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {ret.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0 transition-all hover:bg-primary hover:text-primary-foreground"
                                onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'approved' })}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0 transition-all hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'rejected' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {ret.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="transition-all hover:bg-primary hover:text-primary-foreground"
                              onClick={() => updateStatusMutation.mutate({ id: ret.id, status: 'processed' })}
                            >
                              Process
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReturns?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No returns found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );
}
