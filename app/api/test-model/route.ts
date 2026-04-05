import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { predictFraud } = await import("@/lib/fraudModel");
    const result = predictFraud({
      payment_method: "card", device_type: "desktop", ip_country: "US",
      promo_used: 0, order_subtotal: 50, shipping_fee: 5, tax_amount: 4,
      order_total: 59, zip_mismatch: 0, order_hour: 14, order_dow: 1,
      customer_segment: "premium", loyalty_tier: "gold", gender: "Female",
      customer_age: 35, customer_tenure_days: 365,
      item_count: 1, total_qty: 1, avg_unit_price: 50, max_unit_price: 50,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
