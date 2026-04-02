"use server";
import { getDb } from "@/lib/db";
import { Customer, CustomerSummary } from "@/types";

export async function getCustomers(): Promise<Customer[]> {
  const db = getDb();
  return db
    .prepare(
      `SELECT customer_id, full_name, email, gender, city, state,
              customer_segment, loyalty_tier, is_active
       FROM customers
       WHERE is_active = 1
       ORDER BY full_name`
    )
    .all() as Customer[];
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const db = getDb();
  return (db
    .prepare(`SELECT * FROM customers WHERE customer_id = ?`)
    .get(id) as Customer) ?? null;
}

export async function getCustomerSummary(
  customerId: number
): Promise<CustomerSummary> {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         COUNT(*)            AS total_orders,
         SUM(order_total)    AS total_spent,
         AVG(order_total)    AS avg_order_total,
         SUM(promo_used)     AS promo_orders
       FROM orders
       WHERE customer_id = ?`
    )
    .get(customerId) as CustomerSummary;
}
