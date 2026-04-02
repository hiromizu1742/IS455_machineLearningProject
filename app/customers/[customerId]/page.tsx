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
    { label: "Total Orders", value: summary.total_orders },
    { label: "Total Spent", value: `$${summary.total_spent?.toFixed(2) ?? "0.00"}` },
    { label: "Avg Order Total", value: `$${summary.avg_order_total?.toFixed(2) ?? "0.00"}` },
    { label: "Promo Orders", value: summary.promo_orders ?? 0 },
  ];

  return (
    <div>
      <Link href="/customers" style={backLink}>← All Customers</Link>

      <h1 style={{ marginTop: "0.5rem" }}>{customer.full_name}</h1>
      <p style={{ color: "#555", margin: "0.25rem 0" }}>
        {customer.email} &nbsp;|&nbsp; {customer.gender} &nbsp;|&nbsp;{" "}
        {customer.city ?? "—"}, {customer.state ?? "—"}
      </p>
      <p style={{ color: "#555", margin: "0.25rem 0" }}>
        Segment: <strong>{customer.customer_segment ?? "—"}</strong> &nbsp;|&nbsp;
        Loyalty: <strong>{customer.loyalty_tier ?? "—"}</strong>
      </p>

      <h2 style={{ marginTop: "1.5rem" }}>Order Summary</h2>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem 1.5rem",
              minWidth: "140px",
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: "0.8rem", color: "#888" }}>{s.label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "0.25rem" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
        <Link href={`/customers/${id}/orders`} style={btnPrimary}>
          Order History
        </Link>
        <Link href={`/customers/${id}/new-order`} style={btnSecondary}>
          + New Order
        </Link>
      </div>
    </div>
  );
}

const backLink: React.CSSProperties = {
  color: "#555",
  textDecoration: "none",
  fontSize: "0.9rem",
};
const btnPrimary: React.CSSProperties = {
  background: "#1a1a2e",
  color: "white",
  padding: "0.6rem 1.2rem",
  borderRadius: "6px",
  textDecoration: "none",
};
const btnSecondary: React.CSSProperties = {
  border: "1px solid #1a1a2e",
  color: "#1a1a2e",
  padding: "0.6rem 1.2rem",
  borderRadius: "6px",
  textDecoration: "none",
};
