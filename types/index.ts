export interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  gender: string;
  birthdate: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  customer_segment: string | null;
  loyalty_tier: string | null;
  is_active: number;
}

export interface Order {
  order_id: number;
  customer_id: number;
  order_datetime: string;
  billing_zip: string | null;
  shipping_zip: string | null;
  shipping_state: string | null;
  payment_method: string;
  device_type: string;
  ip_country: string;
  promo_used: number;
  promo_code: string | null;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
  risk_score: number;
  is_fraud: number;
}

export interface Shipment {
  shipment_id: number;
  order_id: number;
  ship_datetime: string;
  carrier: string;
  shipping_method: string;
  distance_band: string;
  promised_days: number;
  actual_days: number;
  late_delivery: number;
  late_delivery_prob: number | null;
}

export interface PriorityQueueRow {
  shipment_id: number;
  order_id: number;
  order_datetime: string;
  order_total: number;
  carrier: string;
  shipping_method: string;
  promised_days: number;
  actual_days: number;
  late_delivery_prob: number;
  customer_id: number;
  full_name: string;
}

export interface CustomerSummary {
  total_orders: number;
  total_spent: number;
  avg_order_total: number;
  promo_orders: number;
}
