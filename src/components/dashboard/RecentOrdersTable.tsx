import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  dispatched: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export function RecentOrdersTable() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers (name, company_name),
          depots (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No orders yet</p>
        <p className="text-sm text-muted-foreground">Create your first sales order to get started</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Depot</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
