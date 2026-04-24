export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface ApiOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  order_date: string;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_company_name?: string | null;
  depot_id: string;
  depot_name: string;
}

export interface LookupCustomer {
  id: string;
  name: string;
  company_name?: string | null;
}

export interface LookupDepot {
  id: string;
  name: string;
}

export interface LookupProduct {
  id: string;
  name: string;
  unit_price: number;
}

export interface LookupQuantity {
  value: number;
}

export interface CreateOrderRequest {
  customer_id: string;
  depot_id: string;
  notes?: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price?: number;
  }>;
}

export interface CreateOrderResponse {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  order_date: string;
}
