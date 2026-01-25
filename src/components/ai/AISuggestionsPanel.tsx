import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface StockSuggestion {
  urgentItems: Array<{
    product: string;
    depot: string;
    currentStock: number;
    recommended: number;
    reason: string;
  }>;
  suggestions: string[];
  insights: string;
}

interface SalesTrends {
  trend: 'increasing' | 'decreasing' | 'stable';
  totalRevenue: number;
  averageOrderValue: number;
  insights: string[];
  recommendations: string[];
  peakPeriods: string[];
}

export function AISuggestionsPanel() {
  const [activeTab, setActiveTab] = useState('stock');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-for-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          quantity,
          products (name, min_stock_level, unit_price),
          depots (name)
        `);
      if (error) throw error;
      return data?.map(i => ({
        product_name: i.products?.name || 'Unknown',
        depot_name: i.depots?.name || 'Unknown',
        quantity: i.quantity,
        min_stock_level: i.products?.min_stock_level || 100,
        unit_price: Number(i.products?.unit_price || 0),
      }));
    },
  });

  const { data: salesData } = useQuery({
    queryKey: ['sales-for-ai'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('order_date, total_amount, status')
        .order('order_date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data?.map(s => ({
        order_date: s.order_date,
        total_amount: Number(s.total_amount),
        status: s.status,
      }));
    },
  });

  const {
    data: stockSuggestions,
    isLoading: stockLoading,
    refetch: refetchStock,
  } = useQuery({
    queryKey: ['ai-stock-suggestions', inventoryData],
    queryFn: async (): Promise<StockSuggestion | null> => {
      if (!inventoryData || inventoryData.length === 0) return null;

      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: { type: 'stock_replenishment', inventoryData },
      });

      if (error) throw error;
      return data?.data as StockSuggestion;
    },
    enabled: !!inventoryData && inventoryData.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: salesTrends,
    isLoading: salesLoading,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ['ai-sales-trends', salesData],
    queryFn: async (): Promise<SalesTrends | null> => {
      if (!salesData || salesData.length === 0) return null;

      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: { type: 'sales_trends', salesData },
      });

      if (error) throw error;
      return data?.data as SalesTrends;
    },
    enabled: !!salesData && salesData.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'stock') {
        await refetchStock();
      } else {
        await refetchSales();
      }
      toast.success('AI suggestions refreshed');
    } catch {
      toast.error('Failed to refresh suggestions');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Insights & Suggestions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="stock">Stock Replenishment</TabsTrigger>
            <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            {stockLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : stockSuggestions ? (
              <div className="space-y-4">
                {stockSuggestions.urgentItems && stockSuggestions.urgentItems.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Urgent Restocking Needed
                    </h4>
                    <div className="space-y-2">
                      {stockSuggestions.urgentItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.product}</p>
                            <p className="text-xs text-muted-foreground">{item.depot}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">{item.currentStock} units</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Order: {item.recommended} units
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stockSuggestions.suggestions && stockSuggestions.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {stockSuggestions.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {stockSuggestions.insights && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{stockSuggestions.insights}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No inventory data available for analysis
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sales">
            {salesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : salesTrends ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {getTrendIcon(salesTrends.trend)}
                      <span className="text-sm font-medium capitalize">{salesTrends.trend}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Trend</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="font-bold text-lg">
                      KES {(salesTrends.totalRevenue || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="font-bold text-lg">
                      KES {(salesTrends.averageOrderValue || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Order</p>
                  </div>
                </div>

                {salesTrends.insights && salesTrends.insights.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Key Insights
                    </h4>
                    <ul className="space-y-2">
                      {salesTrends.insights.map((insight, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {salesTrends.recommendations && salesTrends.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {salesTrends.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No sales data available for analysis
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
