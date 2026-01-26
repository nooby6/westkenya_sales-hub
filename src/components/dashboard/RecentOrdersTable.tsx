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
import { formatMetricTonnes } from '@/lib/unit-converter';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  dispatched: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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
          <Skeleton key={i} className="h-12 w-full animate-pulse" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
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
          <TableHead>Amount (MT)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order, index) => (
          <TableRow 
            key={order.id} 
            className="animate-fade-in transition-colors hover:bg-muted/50"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <TableCell className="font-medium">{order.order_number}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{order.customers?.name}</p>
                <p className="text-xs text-muted-foreground">{order.customers?.company_name}</p>
              </div>
            </TableCell>
            <TableCell>{order.depots?.name}</TableCell>
            <TableCell>{formatMetricTonnes(Number(order.total_amount))}</TableCell>
            <TableCell>
              <Badge variant="outline" className={`${statusColors[order.status]} transition-all duration-300`}>
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
