import { apiRequest } from '@/lib/api/client';
import type {
  ApiOrder,
  CreateOrderResponse,
  CreateOrderRequest,
  LookupCustomer,
  LookupDepot,
  LookupProduct,
  OrderStatus,
} from '@/lib/api/types';

export const ordersApi = {
  list: (statusFilter?: string) => {
    const query = statusFilter && statusFilter !== 'all' ? `?status_filter=${statusFilter}` : '';
    return apiRequest<ApiOrder[]>(`/orders${query}`);
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
};
