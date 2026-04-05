"use server";

import { sql } from "@/lib/db";
import { scoreOrder, type RawOrderRow } from "@/lib/fraudModel";

// ---------------------------------------------------------------------------
// Late-delivery scoring (calls external ML API)
// ---------------------------------------------------------------------------

export async function runScoring(): Promise<{
  success: boolean;
  message: string;
}> {
  const apiUrl = process.env.ML_API_URL;

  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `API error ${res.status}: ${text}` };
      }

      const data = await res.json().catch(() => ({}));
      const count = data.count ?? data.scored ?? "unknown";
      return { success: true, message: `Scoring complete via API. Scored: ${count}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `API call failed: ${msg}` };
    }
  }

  return {
    success: false,
    message:
      "ML_API_URL is not set. Configure your deployed scoring API URL in environment variables.",
  };
}

// ---------------------------------------------------------------------------
// Fraud scoring — runs the TypeScript model against every order in the DB
// ---------------------------------------------------------------------------

export async function runFraudScoring(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Fetch all orders with the features needed for prediction
    const rows = await sql<RawOrderRow>(`
      SELECT
        o.order_id,
        o.payment_method,
        o.device_type,
        o.ip_country,
        o.promo_used::int              AS promo_used,
        o.order_subtotal,
        o.shipping_fee,
        o.tax_amount,
        o.order_total,
        o.billing_zip,
        o.shipping_zip,
        o.order_datetime::text         AS order_datetime,
        c.customer_segment,
        c.loyalty_tier,
        c.gender,
        c.birthdate::text              AS birthdate,
        c.created_at::text             AS customer_created_at,
        COUNT(oi.order_item_id)::int   AS item_count,
        SUM(oi.quantity)::float        AS total_qty,
        AVG(oi.unit_price)::float      AS avg_unit_price,
        MAX(oi.unit_price)::float      AS max_unit_price
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY
        o.order_id, o.payment_method, o.device_type, o.ip_country, o.promo_used,
        o.order_subtotal, o.shipping_fee, o.tax_amount, o.order_total,
        o.billing_zip, o.shipping_zip, o.order_datetime,
        c.customer_segment, c.loyalty_tier, c.gender, c.birthdate, c.created_at
    `);

    // Score every order in TypeScript (no Python at runtime)
    const predictions = rows.map(scoreOrder);

    // Batch-update risk_score + is_fraud using a single JSONB query
    const payload = JSON.stringify(
      predictions.map(p => ({
        id:    p.order_id,
        score: p.risk_score,
        fraud: p.is_fraud,
      }))
    );

    await sql(
      `UPDATE orders o
       SET  risk_score = (v->>'score')::float8,
            is_fraud   = (v->>'fraud')::boolean
       FROM jsonb_array_elements($1::jsonb) AS v
       WHERE o.order_id = (v->>'id')::bigint`,
      [payload]
    );

    const flagged = predictions.filter(p => p.is_fraud).length;
    return {
      success: true,
      message: `Scored ${predictions.length} orders — ${flagged} flagged as fraud.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Fraud scoring failed: ${msg}` };
  }
}
