import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  AnimatedCard,
  AnimatedCardContent,
  AnimatedCardHeader,
  AnimatedCardTitle,
} from '@/components/ui/animated-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package } from 'lucide-react';

const sugarTypeLabels: Record<string, string> = {
  bale_2x10: 'Bale 2×10',
  bale_1x20: 'Bale 1×20',
  bale_1x12: 'Bale 1×12',
  bag_50kg: 'Bag 50kg',
  bag_25kg: 'Bag 25kg',
};

const sugarTypeColors: Record<string, string> = {
  bale_2x10: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  bale_1x20: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  bale_1x12: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  bag_50kg: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  bag_25kg: 'bg-primary/20 text-primary border-primary/30',
};

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
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="text-muted-foreground">View and manage product catalog</p>
      </div>

      <AnimatedCard delay={100}>
        <AnimatedCardHeader>
          <AnimatedCardTitle>Product Catalog</AnimatedCardTitle>
        </AnimatedCardHeader>
        <AnimatedCardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full shimmer rounded" />
              ))}
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-float" />
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
                      className="animate-fade-in hover-lift"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        {product.sugar_type ? (
                          <Badge 
                            variant="outline" 
                            className={`${sugarTypeColors[product.sugar_type] || ''} border`}
                          >
                            {sugarTypeLabels[product.sugar_type] || product.sugar_type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        KES {Number(product.unit_price).toLocaleString()}
                      </TableCell>
                      <TableCell>{product.unit_of_measure}</TableCell>
                      <TableCell>{product.min_stock_level}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={product.is_active ? "default" : "secondary"}
                          className={product.is_active ? "animate-pulse-glow" : ""}
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
