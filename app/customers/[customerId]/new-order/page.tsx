"use client";
import { useState } from "react";
import { createOrder } from "@/actions/orders";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

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
    <div>
      <Link href={`/customers/${customerId}`} style={backLink}>← Back to Dashboard</Link>

      <div style={{ marginTop: "1rem", marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Create New Order</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Fill in the order details below.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: "580px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Section: Order Info */}
        <Section title="Order Info">
          <Field label="Order Date / Time">
            <input style={input} type="datetime-local" value={form.order_datetime}
              onChange={(e) => set("order_datetime", e.target.value)} required />
          </Field>
          <div style={grid2}>
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
        </Section>

        {/* Section: Shipping */}
        <Section title="Shipping">
          <div style={grid2}>
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
        </Section>

        {/* Section: Promo */}
        <Section title="Promotion">
          <div style={grid2}>
            <Field label="Promo Used">
              <select style={input} value={form.promo_used} onChange={(e) => set("promo_used", e.target.value)}>
                <option value="0">No</option>
                <option value="1">Yes</option>
              </select>
            </Field>
            <Field label="Promo Code">
              <input style={input} value={form.promo_code} onChange={(e) => set("promo_code", e.target.value)} placeholder="Optional" />
            </Field>
          </div>
        </Section>

        {/* Section: Pricing */}
        <Section title="Pricing">
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

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.85rem 1rem",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            marginTop: "0.25rem",
          }}>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Order Total</span>
            <span style={{ fontWeight: 700, fontSize: "1.25rem", color: "#0f172a" }}>${total.toFixed(2)}</span>
          </div>
        </Section>

        {status && (
          <div style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            background: status.ok ? "#dcfce7" : "#fee2e2",
            color: status.ok ? "#166534" : "#991b1b",
            fontSize: "0.9rem",
            fontWeight: 500,
          }}>
            {status.msg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? "#94a3b8" : "#4f8ef7",
            color: "white",
            border: "none",
            padding: "0.85rem",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
        >
          {loading ? "Saving..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "0.65rem 1.25rem",
        background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: "#64748b",
      }}>
        {title}
      </div>
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569" }}>{label}</label>
      {children}
    </div>
  );
}

const backLink: React.CSSProperties = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "0.875rem",
};

const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  fontSize: "0.9rem",
  width: "100%",
  boxSizing: "border-box",
  background: "#fff",
  color: "#0f172a",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75rem",
};
