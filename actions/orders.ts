"use server";
import { getDb } from "@/lib/db";
import { Order, PriorityQueueRow } from "@/types";

export async function getOrdersByCustomer(customerId: number): Promise<Order[]> {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM orders
       WHERE customer_id = ?
       ORDER BY order_datetime DESC`
    )
    .all(customerId) as Order[];
}

export async function createOrder(data: {
  customer_id: number;
  order_datetime: string;
  billing_zip: string;
  shipping_zip: string;
  shipping_state: string;
  payment_method: string;
  device_type: string;
  ip_country: string;
  promo_used: number;
  promo_code: string;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
}): Promise<{ order_id: number }> {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO orders
         (customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
          payment_method, device_type, ip_country, promo_used, promo_code,
          order_subtotal, shipping_fee, tax_amount, order_total,
          risk_score, is_fraud)
       VALUES
         (@customer_id, @order_datetime, @billing_zip, @shipping_zip, @shipping_state,
          @payment_method, @device_type, @ip_country, @promo_used, @promo_code,
          @order_subtotal, @shipping_fee, @tax_amount, @order_total,
          0, 0)`
    )
    .run(data);
  return { order_id: result.lastInsertRowid as number };
}

export async function getPriorityQueue(): Promise<PriorityQueueRow[]> {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         s.shipment_id, s.order_id, s.carrier, s.shipping_method,
         s.promised_days, s.actual_days, s.late_delivery_prob,
         o.order_datetime, o.order_total, o.customer_id,
         c.full_name
       FROM shipments s
       JOIN orders o ON s.order_id = o.order_id
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE s.late_delivery_prob IS NOT NULL
       ORDER BY s.late_delivery_prob DESC
       LIMIT 50`
    )
    .all() as PriorityQueueRow[];
}
