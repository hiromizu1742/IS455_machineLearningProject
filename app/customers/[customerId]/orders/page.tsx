import { getOrdersByCustomer } from "@/actions/orders";
import { getCustomerById } from "@/actions/customers";
import Link from "next/link";

export default async function OrderHistoryPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const id = Number(customerId);

  const [customer, orders] = await Promise.all([
    getCustomerById(id),
    getOrdersByCustomer(id),
  ]);

  return (
    <div>
      <Link href={`/customers/${id}`} style={backLink}>← Back to Dashboard</Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Order History</h1>
          {customer && (
            <p style={{ color: "#64748b", marginTop: "0.25rem" }}>{customer.full_name} · {orders.length} orders</p>
          )}
        </div>
        <Link href={`/customers/${id}/new-order`} style={btnPrimary}>
          + New Order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div style={{
          padding: "3rem",
          textAlign: "center",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          color: "#64748b",
        }}>
          No orders yet.
          <br />
          <Link href={`/customers/${id}/new-order`} style={{ color: "#4f8ef7", marginTop: "0.5rem", display: "inline-block" }}>
            Create the first order →
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={th}>Date</th>
                <th style={th}>Payment</th>
                <th style={th}>Device</th>
                <th style={th}>Promo</th>
                <th style={{ ...th, textAlign: "right" }}>Subtotal</th>
                <th style={{ ...th, textAlign: "right" }}>Shipping</th>
                <th style={{ ...th, textAlign: "right" }}>Tax</th>
                <th style={{ ...th, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.order_id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={td}>{o.order_datetime.slice(0, 10)}</td>
                  <td style={td}>{o.payment_method}</td>
                  <td style={td}>{o.device_type}</td>
                  <td style={td}>
                    {o.promo_used ? (
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600 }}>
                        Yes
                      </span>
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: "right", color: "#64748b" }}>${o.order_subtotal.toFixed(2)}</td>
                  <td style={{ ...td, textAlign: "right", color: "#64748b" }}>${o.shipping_fee.toFixed(2)}</td>
                  <td style={{ ...td, textAlign: "right", color: "#64748b" }}>${o.tax_amount.toFixed(2)}</td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                    ${o.order_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const backLink: React.CSSProperties = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: "0.875rem",
};

const btnPrimary: React.CSSProperties = {
  background: "#4f8ef7",
  color: "white",
  padding: "0.55rem 1.25rem",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const th: React.CSSProperties = {
  padding: "0.75rem 1.25rem",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#64748b",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "0.85rem 1.25rem",
  verticalAlign: "middle",
};
