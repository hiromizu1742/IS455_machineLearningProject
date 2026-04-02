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
      <Link href={`/customers/${id}`} style={backLink}>
        ← Back to Dashboard
      </Link>
      <h1 style={{ marginTop: "0.5rem" }}>
        Order History — {customer?.full_name}
      </h1>
      <p style={{ color: "#555" }}>{orders.length} orders found</p>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
          <thead>
            <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
              <th style={th}>Order ID</th>
              <th style={th}>Date</th>
              <th style={th}>Payment</th>
              <th style={th}>Device</th>
              <th style={th}>Promo</th>
              <th style={th}>Subtotal</th>
              <th style={th}>Shipping</th>
              <th style={th}>Tax</th>
              <th style={th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.order_id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={td}>{o.order_id}</td>
                <td style={td}>{o.order_datetime.slice(0, 10)}</td>
                <td style={td}>{o.payment_method}</td>
                <td style={td}>{o.device_type}</td>
                <td style={td}>{o.promo_used ? "Yes" : "No"}</td>
                <td style={td}>${o.order_subtotal.toFixed(2)}</td>
                <td style={td}>${o.shipping_fee.toFixed(2)}</td>
                <td style={td}>${o.tax_amount.toFixed(2)}</td>
                <td style={{ ...td, fontWeight: "bold" }}>
                  ${o.order_total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const backLink: React.CSSProperties = { color: "#555", textDecoration: "none", fontSize: "0.9rem" };
const th: React.CSSProperties = { padding: "0.6rem 1rem", borderBottom: "2px solid #ccc" };
const td: React.CSSProperties = { padding: "0.6rem 1rem" };
