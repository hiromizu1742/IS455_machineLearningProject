import { getCustomers } from "@/actions/customers";
import Link from "next/link";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <h1>Select a Customer</h1>
      <p style={{ color: "#555" }}>{customers.length} active customers</p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "1rem",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={th}>Segment</th>
            <th style={th}>Loyalty</th>
            <th style={th}>City</th>
            <th style={th}></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.customer_id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={td}>{c.customer_id}</td>
              <td style={td}>{c.full_name}</td>
              <td style={td}>{c.email}</td>
              <td style={td}>{c.customer_segment ?? "—"}</td>
              <td style={td}>{c.loyalty_tier ?? "—"}</td>
              <td style={td}>{c.city ?? "—"}</td>
              <td style={td}>
                <Link
                  href={`/customers/${c.customer_id}`}
                  style={{
                    background: "#1a1a2e",
                    color: "white",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "0.85rem",
                  }}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "0.6rem 1rem",
  borderBottom: "2px solid #ccc",
};
const td: React.CSSProperties = {
  padding: "0.6rem 1rem",
};
