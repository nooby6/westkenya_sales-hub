import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Package, AlertTriangle, Search } from 'lucide-react';
import { useState } from 'react';

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
          products (name, sku, min_stock_level, unit_price),
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
    if (quantity <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    if (quantity < minLevel) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const totalStock = filteredInventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const lowStockCount = filteredInventory?.filter(
    item => item.quantity < (item.products?.min_stock_level || 0)
  ).length || 0;
  const totalValue = filteredInventory?.reduce(
    (sum, item) => sum + item.quantity * Number(item.products?.unit_price || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground">Track and manage stock levels across all depots</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock.toLocaleString()} units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockCount} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-chart-1/10 p-3">
                <Package className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={depotFilter} onValueChange={setDepotFilter}>
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredInventory || filteredInventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No inventory items found!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Depot</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item.quantity, item.products?.min_stock_level || 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.products?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.products?.sku}</TableCell>
                      <TableCell>{item.depots?.name}</TableCell>
                      <TableCell className="font-semibold">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell>{item.products?.min_stock_level?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.color}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
