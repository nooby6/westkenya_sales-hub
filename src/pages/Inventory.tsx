import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedCard, AnimatedCardContent, AnimatedCardHeader, AnimatedCardTitle } from '@/components/ui/animated-card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertTriangle, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { formatMetricTonnes, sugarTypeLabels } from '@/lib/unit-converter';

export default function Inventory() {
  const [depotFilter, setDepotFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: depots } = useQuery({
    queryKey: ['depots'],
    queryFn: async () => {
      const { data, error } = await supabase.from('depots').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', depotFilter],
    queryFn: async () => {
      let query = supabase
        .from('inventory')
        .select(`
          *,
          products (name, sku, min_stock_level, unit_price, sugar_type),
          depots (name, location)
        `);

      if (depotFilter !== 'all') {
        query = query.eq('depot_id', depotFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const filteredInventory = inventory?.filter(item =>
    item.products?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.products?.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    if (quantity < minLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
  };

  // Calculate metrics in metric tonnes
  const totalStockKg = filteredInventory?.reduce((sum, item) => {
    const unitWeight = item.products?.sugar_type?.includes('50') ? 50 : 
                       item.products?.sugar_type?.includes('25') ? 25 :
                       item.products?.sugar_type?.includes('12') ? 12 : 20;
    return sum + (item.quantity * unitWeight);
  }, 0) || 0;
  
  const lowStockCount = filteredInventory?.filter(
    item => item.quantity < (item.products?.min_stock_level || 0)
  ).length || 0;
  
  const totalValue = filteredInventory?.reduce(
    (sum, item) => sum + item.quantity * Number(item.products?.unit_price || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Inventory Management
        </h1>
        <p className="text-muted-foreground">Track and manage stock levels across all depots (Metric Tonnes)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnimatedCard delay={0}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center gap-4 group">
              <div className="rounded-lg bg-primary/10 p-3 transition-transform duration-300 group-hover:scale-110">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">{formatMetricTonnes(totalStockKg)}</p>
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={50}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center gap-4 group">
              <div className="rounded-lg bg-destructive/10 p-3 transition-transform duration-300 group-hover:scale-110">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockCount} items</p>
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
        <AnimatedCard delay={100}>
          <AnimatedCardContent className="pt-6">
            <div className="flex items-center gap-4 group">
              <div className="rounded-lg bg-chart-1/10 p-3 transition-transform duration-300 group-hover:scale-110">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p>
              </div>
            </div>
          </AnimatedCardContent>
        </AnimatedCard>
      </div>

      {/* Filters */}
      <AnimatedCard delay={150}>
        <AnimatedCardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={depotFilter} onValueChange={setDepotFilter}>
              <SelectTrigger className="w-[200px] transition-all duration-300">
                <SelectValue placeholder="Filter by depot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depots</SelectItem>
                {depots?.map(depot => (
                  <SelectItem key={depot.id} value={depot.id}>
                    {depot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </AnimatedCardContent>
      </AnimatedCard>

      {/* Inventory Table */}
      <AnimatedCard delay={200}>
        <AnimatedCardHeader>
          <AnimatedCardTitle>Stock Levels</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full animate-pulse" />
              ))}
            </div>
          ) : !filteredInventory || filteredInventory.length === 0 ? (
            <div className="text-center py-8 animate-fade-in">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Sugar Type</TableHead>
                    <TableHead>Depot</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weight (MT)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item, index) => {
                    const status = getStockStatus(item.quantity, item.products?.min_stock_level || 0);
                    const unitWeight = item.products?.sugar_type?.includes('50') ? 50 : 
                                       item.products?.sugar_type?.includes('25') ? 25 :
                                       item.products?.sugar_type?.includes('12') ? 12 : 20;
                    const weightKg = item.quantity * unitWeight;
                    return (
                      <TableRow 
                        key={item.id}
                        className="animate-fade-in transition-colors hover:bg-muted/50"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell className="font-medium">{item.products?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.products?.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="transition-all duration-300">
                            {item.products?.sugar_type ? sugarTypeLabels[item.products.sugar_type] || item.products.sugar_type : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.depots?.name}</TableCell>
                        <TableCell className="font-semibold">{item.quantity.toLocaleString()}</TableCell>
                        <TableCell>{formatMetricTonnes(weightKg)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${status.color} transition-all duration-300`}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          KES {(item.quantity * Number(item.products?.unit_price || 0)).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </AnimatedCardContent>
      </AnimatedCard>
    </div>
  );
}
