"use server";
import { sql, sqlOne } from "@/lib/db";
import { FraudAlertsRow, Order, PriorityQueueRow } from "@/types";

export async function getOrdersByCustomer(customerId: number): Promise<Order[]> {
  return sql<Order>(
    `SELECT * FROM orders
     WHERE customer_id = $1
     ORDER BY order_datetime DESC`,
    [customerId]
  );
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
  promo_used: boolean;
  promo_code: string;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
}): Promise<{ order_id: number }> {
  const inserted = await sqlOne<{ order_id: number }>(
    `INSERT INTO orders
       (customer_id, order_datetime, billing_zip, shipping_zip, shipping_state,
        payment_method, device_type, ip_country, promo_used, promo_code,
        order_subtotal, shipping_fee, tax_amount, order_total,
        risk_score, is_fraud)
     VALUES
       ($1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        0, FALSE)
     RETURNING order_id`,
    [
      data.customer_id,
      data.order_datetime,
      data.billing_zip,
      data.shipping_zip,
      data.shipping_state,
      data.payment_method,
      data.device_type,
      data.ip_country,
      data.promo_used,
      data.promo_code,
      data.order_subtotal,
      data.shipping_fee,
      data.tax_amount,
      data.order_total,
    ]
  );

  if (!inserted) {
    throw new Error("Failed to create order.");
  }

  return { order_id: inserted.order_id };
}

export async function getFraudAlerts(): Promise<FraudAlertsRow[]> {
  return sql<FraudAlertsRow>(
    `SELECT
       o.order_id, o.order_datetime, o.order_total,
       o.payment_method, o.device_type, o.ip_country,
       o.promo_used, o.risk_score, o.is_fraud,
       o.customer_id, c.full_name
     FROM orders o
     JOIN customers c ON o.customer_id = c.customer_id
     WHERE o.risk_score > 0
     ORDER BY o.risk_score DESC
     LIMIT 50`
  );
}

export async function getPriorityQueue(): Promise<PriorityQueueRow[]> {
  return sql<PriorityQueueRow>(
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
  );
}
