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
import { Package } from 'lucide-react';
import { sugarTypeLabels } from '@/lib/unit-converter';

export default function Products() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Products
        </h1>
        <p className="text-muted-foreground">View and manage product catalog with sugar types</p>
      </div>

      <AnimatedCard delay={100}>
        <AnimatedCardHeader>
          <AnimatedCardTitle>Product Catalog</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8 animate-fade-in">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Sugar Type</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow 
                      key={product.id}
                      className="animate-fade-in transition-colors hover:bg-muted/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="transition-all duration-300">
                          {product.sugar_type ? sugarTypeLabels[product.sugar_type] || product.sugar_type : 'Not set'}
                        </Badge>
                      </TableCell>
                      <TableCell>KES {Number(product.unit_price).toLocaleString()}</TableCell>
                      <TableCell>{product.unit_of_measure}</TableCell>
                      <TableCell>{product.min_stock_level}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.is_active ? "default" : "secondary"}
                          className="transition-all duration-300"
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
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
