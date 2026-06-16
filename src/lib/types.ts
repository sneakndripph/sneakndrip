export type ProductStatus = "on-hand" | "pre-order";
export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMethod = "gcash" | "maya" | "bank_transfer" | "cod";
export type PaymentType = "downpayment" | "full_payment";
export type Gender = "men" | "women" | "unisex" | "kids";

export interface ProductSize {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  colorway?: string;
  gender: string;
  description?: string;
  status: ProductStatus;
  eta_start?: string;
  eta_end?: string;
  srp_price: number;
  downpayment_price: number;
  full_payment_price: number;
  images?: string[];
  bg?: string;
  sizes: ProductSize[];
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
  sale_price?: number | null;
  sale_start?: string | null;
  sale_end?: string | null;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
  payment_type: PaymentType;
  unit_price: number;
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  mobile: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postal_code: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  subtotal: number;
  shipping_fee: number;
  total: number;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  notes?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  mobile?: string;
  created_at: string;
  orders_count?: number;
  total_spent?: number;
}

export interface Review {
  id: string;
  product_id?: string;
  customer_id?: string;
  author_name: string;
  rating: number;
  title?: string;
  body: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface AdminMetrics {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  total_customers: number;
  orders_today: number;
  revenue_today: number;
  pending_orders: number;
}
