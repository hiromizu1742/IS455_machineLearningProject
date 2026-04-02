"use client";
import { useState } from "react";
import { createOrder } from "@/actions/orders";
import { useRouter, useParams } from "next/navigation";

const PAYMENT_METHODS = ["card", "paypal", "bank", "crypto"];
const DEVICE_TYPES = ["mobile", "desktop", "tablet"];

export default function NewOrderPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Number(params.customerId);

  const [form, setForm] = useState({
    order_datetime: new Date().toISOString().slice(0, 16),
    billing_zip: "",
    shipping_zip: "",
    shipping_state: "",
    payment_method: "card",
    device_type: "desktop",
    ip_country: "US",
    promo_used: "0",
    promo_code: "",
    order_subtotal: "",
    shipping_fee: "",
    tax_amount: "",
  });

  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const total =
    (parseFloat(form.order_subtotal) || 0) +
    (parseFloat(form.shipping_fee) || 0) +
    (parseFloat(form.tax_amount) || 0);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await createOrder({
        customer_id: customerId,
        order_datetime: form.order_datetime,
        billing_zip: form.billing_zip,
        shipping_zip: form.shipping_zip,
        shipping_state: form.shipping_state,
        payment_method: form.payment_method,
        device_type: form.device_type,
        ip_country: form.ip_country,
        promo_used: Number(form.promo_used),
        promo_code: form.promo_code,
        order_subtotal: parseFloat(form.order_subtotal),
        shipping_fee: parseFloat(form.shipping_fee),
        tax_amount: parseFloat(form.tax_amount),
        order_total: total,
      });
      setStatus({ ok: true, msg: "Order created successfully!" });
      setTimeout(() => router.push(`/customers/${customerId}/orders`), 1000);
    } catch {
      setStatus({ ok: false, msg: "Failed to create order. Please try again." });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "560px" }}>
      <a href={`/customers/${customerId}`} style={backLink}>
        ← Back to Dashboard
      </a>
      <h1 style={{ marginTop: "0.5rem" }}>Create New Order</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
        <Field label="Order Date/Time">
          <input style={input} type="datetime-local" value={form.order_datetime}
            onChange={(e) => set("order_datetime", e.target.value)} required />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Field label="Billing ZIP">
            <input style={input} value={form.billing_zip} onChange={(e) => set("billing_zip", e.target.value)} />
          </Field>
          <Field label="Shipping ZIP">
            <input style={input} value={form.shipping_zip} onChange={(e) => set("shipping_zip", e.target.value)} />
          </Field>
          <Field label="Shipping State">
            <input style={input} placeholder="e.g. CA" value={form.shipping_state}
              onChange={(e) => set("shipping_state", e.target.value)} />
          </Field>
          <Field label="IP Country">
            <input style={input} placeholder="e.g. US" value={form.ip_country}
              onChange={(e) => set("ip_country", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Field label="Payment Method">
            <select style={input} value={form.payment_method} onChange={(e) => set("payment_method", e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Device Type">
            <select style={input} value={form.device_type} onChange={(e) => set("device_type", e.target.value)}>
              {DEVICE_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Field label="Promo Used">
            <select style={input} value={form.promo_used} onChange={(e) => set("promo_used", e.target.value)}>
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </Field>
          <Field label="Promo Code">
            <input style={input} value={form.promo_code} onChange={(e) => set("promo_code", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          <Field label="Subtotal ($)">
            <input style={input} type="number" min="0" step="0.01" value={form.order_subtotal}
              onChange={(e) => set("order_subtotal", e.target.value)} required />
          </Field>
          <Field label="Shipping Fee ($)">
            <input style={input} type="number" min="0" step="0.01" value={form.shipping_fee}
              onChange={(e) => set("shipping_fee", e.target.value)} required />
          </Field>
          <Field label="Tax ($)">
            <input style={input} type="number" min="0" step="0.01" value={form.tax_amount}
              onChange={(e) => set("tax_amount", e.target.value)} required />
          </Field>
        </div>

        <div style={{ padding: "0.75rem", background: "#f0f0f0", borderRadius: "6px" }}>
          <strong>Order Total: ${total.toFixed(2)}</strong>
        </div>

        {status && (
          <p style={{ color: status.ok ? "green" : "red", margin: 0 }}>{status.msg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#888" : "#1a1a2e",
            color: "white",
            border: "none",
            padding: "0.75rem",
            borderRadius: "6px",
            fontSize: "1rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Saving..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <label style={{ fontSize: "0.85rem", color: "#555" }}>{label}</label>
      {children}
    </div>
  );
}

const backLink: React.CSSProperties = { color: "#555", textDecoration: "none", fontSize: "0.9rem" };
const input: React.CSSProperties = {
  padding: "0.5rem",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "0.95rem",
  width: "100%",
  boxSizing: "border-box",
};
