import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  dispatched: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export default function Orders() {
  const { user, isAdmin, isManager } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('sales_orders')
        .select(`
          *,
          customers (name, company_name),
          depots (name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const { data: depots } = useQuery({
    queryKey: ['depots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depots')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      customer_id: string;
      depot_id: string;
      notes?: string;
      items: { product_id: string; quantity: number; unit_price: number }[];
    }) => {
      const totalAmount = orderData.items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert([{
          customer_id: orderData.customer_id,
          depot_id: orderData.depot_id,
          sales_rep_id: user!.id,
          notes: orderData.notes,
          total_amount: totalAmount,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsCreateOpen(false);
      toast.success('Order created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create order: ' + error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled" }) => {
      const { error } = await supabase
        .from('sales_orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    }
  });

  const handleCreateOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const customer_id = formData.get('customer_id') as string;
    const depot_id = formData.get('depot_id') as string;
    const notes = formData.get('notes') as string;
    const product_id = formData.get('product_id') as string;
    const quantity = Number(formData.get('quantity'));
    
    const product = products?.find(p => p.id === product_id);
    if (!product) {
      toast.error('Please select a product');
      return;
    }

    createOrderMutation.mutate({
      customer_id,
      depot_id,
      notes,
      items: [{ product_id, quantity, unit_price: Number(product.unit_price) }],
    });
  };

  const filteredOrders = orders?.filter(order =>
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customers?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sales Orders</h1>
          <p className="text-muted-foreground">Manage and track all sales orders</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select name="customer_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.company_name && `(${customer.company_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Depot</Label>
                <Select name="depot_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select depot" />
                  </SelectTrigger>
                  <SelectContent>
                    {depots?.map(depot => (
                      <SelectItem key={depot.id} value={depot.id}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select name="product_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - KES {Number(product.unit_price).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input name="quantity" type="number" min="1" defaultValue="1" required />
              </div>
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea name="notes" placeholder="Add any special instructions..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredOrders || filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customers?.name}</p>
                        <p className="text-xs text-muted-foreground">{order.customers?.company_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>{order.depots?.name}</TableCell>
                    <TableCell>KES {Number(order.total_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.order_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(isAdmin || isManager) && order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <Select
                            value={order.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ id: order.id, status })}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="dispatched">Dispatched</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
