import { getCustomerById, getCustomerSummary } from "@/actions/customers";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const id = Number(customerId);

  const [customer, summary] = await Promise.all([
    getCustomerById(id),
    getCustomerSummary(id),
  ]);

  if (!customer) return notFound();

  const stats = [
    { label: "Total Orders", value: summary.total_orders, icon: "📦" },
    { label: "Total Spent", value: `$${summary.total_spent?.toFixed(2) ?? "0.00"}`, icon: "💳" },
    { label: "Avg Order", value: `$${summary.avg_order_total?.toFixed(2) ?? "0.00"}`, icon: "📊" },
    { label: "Promo Orders", value: summary.promo_orders ?? 0, icon: "🏷️" },
  ];

  return (
    <div>
      {/* Back link */}
      <Link href="/customers" style={backLink}>← All Customers</Link>

      {/* Profile header */}
      <div style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "1.5rem 2rem",
        marginTop: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#1a1a2e",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.4rem",
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {customer.full_name.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {customer.full_name}
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.2rem", fontSize: "0.9rem" }}>
            {customer.email}
            {customer.city && ` · ${customer.city}${customer.state ? `, ${customer.state}` : ""}`}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            {customer.customer_segment && (
              <span style={badge("#ede9fe", "#5b21b6")}>{customer.customer_segment}</span>
            )}
            {customer.loyalty_tier && (
              <span style={badge("#fef3c7", "#92400e")}>{customer.loyalty_tier}</span>
            )}
            {customer.gender && (
              <span style={badge("#f0f9ff", "#0369a1")}>{customer.gender}</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#64748b", marginTop: "1.75rem", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Order Summary
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1.25rem 1.5rem",
          }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a", marginTop: "0.4rem" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <Link href={`/customers/${id}/new-order`} style={btnPrimary}>
          + New Order
        </Link>
        <Link href={`/customers/${id}/orders`} style={btnSecondary}>
          Order History
        </Link>
      </div>
    </div>
  );
}

const badge = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  padding: "2px 10px",
  borderRadius: "9999px",
  fontSize: "0.75rem",
  fontWeight: 600,
});

const backLink: React.CSSProperties = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "0.875rem",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
};

const btnPrimary: React.CSSProperties = {
  background: "#4f8ef7",
  color: "white",
  padding: "0.65rem 1.5rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
};

const btnSecondary: React.CSSProperties = {
  color: "#4f8ef7",
  padding: "0.65rem 1rem",
  textDecoration: "none",
  fontSize: "0.9rem",
  borderBottom: "1px solid #4f8ef7",
};
