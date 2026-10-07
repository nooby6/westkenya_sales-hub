import { apiRequest } from '@/lib/api/client';
import type {
  ApiOrder,
  CreateOrderResponse,
  CreateOrderRequest,
  LookupCustomer,
  LookupDepot,
  LookupProduct,
  LookupQuantity,
  OrderStatus,
} from '@/lib/api/types';

export const ordersApi = {
  list: (filters?: {
    statusFilter?: string;
    depotId?: string;
    productId?: string;
    quantity?: string;
  }) => {
    const params = new URLSearchParams();

    if (filters?.statusFilter && filters.statusFilter !== 'all') {
      params.set('status_filter', filters.statusFilter);
    }
    if (filters?.depotId && filters.depotId !== 'all') {
      params.set('depot_id', filters.depotId);
    }
    if (filters?.productId && filters.productId !== 'all') {
      params.set('product_id', filters.productId);
    }
    if (filters?.quantity && filters.quantity !== 'all') {
      params.set('quantity', filters.quantity);
    }

    const query = params.toString();
    return apiRequest<ApiOrder[]>(`/orders${query ? `?${query}` : ''}`);
  },
  create: (payload: CreateOrderRequest) => {
    return apiRequest<CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateStatus: (orderId: string, status: OrderStatus) => {
    return apiRequest<void>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  customers: () => apiRequest<LookupCustomer[]>('/orders/lookups/customers'),
  depots: () => apiRequest<LookupDepot[]>('/orders/lookups/depots'),
  products: () => apiRequest<LookupProduct[]>('/orders/lookups/products'),
  quantities: () => apiRequest<LookupQuantity[]>('/orders/lookups/quantities'),
};
