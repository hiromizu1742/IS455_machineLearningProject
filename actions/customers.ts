"use server";
import { sql, sqlOne } from "@/lib/db";
import { Customer, CustomerSummary } from "@/types";

export async function getCustomers(): Promise<Customer[]> {
  return sql<Customer>(
    `SELECT customer_id, full_name, email, gender, city, state,
            customer_segment, loyalty_tier, is_active
     FROM customers
     WHERE is_active = TRUE
     ORDER BY full_name`
  );
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  return sqlOne<Customer>(`SELECT * FROM customers WHERE customer_id = $1`, [id]);
}

export async function getCustomerSummary(
  customerId: number
): Promise<CustomerSummary> {
  const summary = await sqlOne<CustomerSummary>(
    `SELECT
       COUNT(*)::int AS total_orders,
       COALESCE(SUM(order_total), 0) AS total_spent,
       COALESCE(AVG(order_total), 0) AS avg_order_total,
       COALESCE(SUM(CASE WHEN promo_used THEN 1 ELSE 0 END), 0)::int AS promo_orders
     FROM orders
     WHERE customer_id = $1`,
    [customerId]
  );

  return (
    summary ?? {
      total_orders: 0,
      total_spent: 0,
      avg_order_total: 0,
      promo_orders: 0,
    }
  );
}
