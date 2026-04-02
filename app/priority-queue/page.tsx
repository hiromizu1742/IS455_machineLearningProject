import { getPriorityQueue } from "@/actions/orders";
import RunScoringButton from "@/components/RunScoringButton";
import Link from "next/link";

export default async function PriorityQueuePage() {
  const orders = await getPriorityQueue();

  return (
    <div>
      <h1>Late Delivery Priority Queue</h1>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Top {orders.length} shipments ranked by predicted late delivery probability.
        Run scoring to refresh predictions.
      </p>

      <RunScoringButton />

      {orders.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            background: "#fff8e1",
            border: "1px solid #f0c040",
            borderRadius: "8px",
          }}
        >
          <strong>No predictions yet.</strong> Click &quot;Run Scoring&quot; above to generate predictions.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0", textAlign: "left" }}>
              <th style={th}>Rank</th>
              <th style={th}>Shipment ID</th>
              <th style={th}>Order ID</th>
              <th style={th}>Customer</th>
              <th style={th}>Order Date</th>
              <th style={th}>Carrier</th>
              <th style={th}>Method</th>
              <th style={th}>Promised</th>
              <th style={th}>Actual</th>
              <th style={th}>Late Prob</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((row, i) => {
              const prob = row.late_delivery_prob;
              const rowBg =
                prob >= 0.8 ? "#fff0f0" : prob >= 0.6 ? "#fffbe6" : "white";
              return (
                <tr
                  key={row.shipment_id}
                  style={{ borderBottom: "1px solid #eee", background: rowBg }}
                >
                  <td style={td}>{i + 1}</td>
                  <td style={td}>{row.shipment_id}</td>
                  <td style={td}>{row.order_id}</td>
                  <td style={td}>
                    <Link
                      href={`/customers/${row.customer_id}`}
                      style={{ color: "#1a1a2e" }}
                    >
                      {row.full_name}
                    </Link>
                  </td>
                  <td style={td}>{row.order_datetime.slice(0, 10)}</td>
                  <td style={td}>{row.carrier}</td>
                  <td style={td}>{row.shipping_method}</td>
                  <td style={td}>{row.promised_days}d</td>
                  <td style={td}>{row.actual_days}d</td>
                  <td style={{ ...td, fontWeight: "bold" }}>
                    <span
                      style={{
                        color: prob >= 0.8 ? "#c0392b" : prob >= 0.6 ? "#e67e22" : "#27ae60",
                      }}
                    >
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.6rem 1rem", borderBottom: "2px solid #ccc" };
const td: React.CSSProperties = { padding: "0.6rem 1rem" };
