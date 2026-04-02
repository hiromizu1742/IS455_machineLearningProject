import { getPriorityQueue } from "@/actions/orders";
import RunScoringButton from "@/components/RunScoringButton";
import Link from "next/link";

const legend = [
  { label: "High Risk ≥ 80%", bg: "#fee2e2", color: "#991b1b", dot: "#e53e3e" },
  { label: "Medium 60–79%", bg: "#fef9c3", color: "#92400e", dot: "#d97706" },
  { label: "Low < 60%",      bg: "#f0fdf4", color: "#166534", dot: "#16a34a" },
];

function riskStyle(prob: number): React.CSSProperties {
  if (prob >= 0.8) return { background: "#fee2e2" };
  if (prob >= 0.6) return { background: "#fef9c3" };
  return {};
}

function riskColor(prob: number): string {
  if (prob >= 0.8) return "#e53e3e";
  if (prob >= 0.6) return "#d97706";
  return "#16a34a";
}

export default async function PriorityQueuePage() {
  const orders = await getPriorityQueue();

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Late Delivery Priority Queue</h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
            {orders.length > 0
              ? `${orders.length} shipments ranked by predicted late delivery probability`
              : "No predictions yet — run scoring to generate results"}
          </p>
        </div>
        <RunScoringButton />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {legend.map(({ label, color, dot }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div style={{
          padding: "3rem",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          textAlign: "center",
          color: "#92400e",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
          <strong>No predictions yet.</strong>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Click <strong>Run Scoring</strong> above to generate late delivery predictions.
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ ...th, width: "48px" }}>#</th>
                <th style={th}>Customer</th>
                <th style={th}>Order Date</th>
                <th style={th}>Carrier</th>
                <th style={th}>Method</th>
                <th style={{ ...th, textAlign: "center" }}>Promised</th>
                <th style={{ ...th, textAlign: "center" }}>Actual</th>
                <th style={{ ...th, textAlign: "right" }}>Late Probability</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row, i) => {
                const prob = row.late_delivery_prob;
                return (
                  <tr
                    key={row.shipment_id}
                    style={{ borderBottom: "1px solid #f1f5f9", ...riskStyle(prob) }}
                  >
                    <td style={{ ...td, color: "#94a3b8", fontWeight: 600, textAlign: "center" }}>{i + 1}</td>
                    <td style={td}>
                      <Link
                        href={`/customers/${row.customer_id}`}
                        style={{ color: "#1a1a2e", fontWeight: 600, textDecoration: "none" }}
                      >
                        {row.full_name}
                      </Link>
                    </td>
                    <td style={{ ...td, color: "#64748b" }}>{row.order_datetime.slice(0, 10)}</td>
                    <td style={{ ...td, color: "#64748b" }}>{row.carrier}</td>
                    <td style={{ ...td, color: "#64748b" }}>{row.shipping_method}</td>
                    <td style={{ ...td, textAlign: "center", color: "#64748b" }}>{row.promised_days}d</td>
                    <td style={{ ...td, textAlign: "center", color: "#64748b" }}>{row.actual_days}d</td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <span style={{
                        color: riskColor(prob),
                        fontWeight: 700,
                        fontSize: "1rem",
                      }}>
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
