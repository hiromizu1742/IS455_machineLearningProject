export const dynamic = "force-dynamic";

import { getFraudAlerts } from "@/actions/orders";
import RunFraudScoringButton from "@/components/RunFraudScoringButton";
import Link from "next/link";

const legend = [
  { label: "High Risk ≥ 70%", bg: "#fee2e2", color: "#991b1b", dot: "#e53e3e" },
  { label: "Medium 40–69%",   bg: "#fef9c3", color: "#92400e", dot: "#d97706" },
  { label: "Low < 40%",       bg: "#f0fdf4", color: "#166534", dot: "#16a34a" },
];

function riskStyle(score: number): React.CSSProperties {
  if (score >= 0.7) return { background: "#fee2e2" };
  if (score >= 0.4) return { background: "#fef9c3" };
  return {};
}

function riskColor(score: number): string {
  if (score >= 0.7) return "#e53e3e";
  if (score >= 0.4) return "#d97706";
  return "#16a34a";
}

function paymentBadge(method: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    crypto:      { bg: "#fce7f3", color: "#9d174d" },
    wire:        { bg: "#ede9fe", color: "#5b21b6" },
    card:        { bg: "#dbeafe", color: "#1e40af" },
    paypal:      { bg: "#d1fae5", color: "#065f46" },
  };
  const c = colors[method?.toLowerCase()] ?? { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      ...c,
      padding: "0.2rem 0.5rem",
      borderRadius: "4px",
      fontSize: "0.78rem",
      fontWeight: 600,
      textTransform: "uppercase" as const,
    }}>
      {method}
    </span>
  );
}

export default async function FraudAlertsPage() {
  const orders = await getFraudAlerts();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Fraud Alerts</h1>
          <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
            {orders.length > 0
              ? `Top ${orders.length} orders ranked by predicted fraud probability`
              : "No scores yet — click Run Fraud Scoring to score all orders"}
          </p>
        </div>
        <RunFraudScoringButton />
      </div>

      {/* Model info banner */}
      <div style={{
        background: "#f0f4ff",
        border: "1px solid #c7d2fe",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        marginBottom: "1.25rem",
        fontSize: "0.85rem",
        color: "#3730a3",
      }}>
        Model: Calibrated Logistic Regression · AUC 0.75 · Trained on 5,000 orders from shop.db ·
        Inference runs in-process via TypeScript (no Python at runtime)
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
          background: "#f5f3ff",
          border: "1px solid #ddd6fe",
          borderRadius: "10px",
          textAlign: "center",
          color: "#5b21b6",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛡️</div>
          <strong>No fraud scores yet.</strong>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
            Click <strong>Run Fraud Scoring</strong> above to score all orders with the trained model.
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
                <th style={{ ...th, textAlign: "right" as const }}>Total</th>
                <th style={th}>Payment</th>
                <th style={th}>Device</th>
                <th style={th}>IP Country</th>
                <th style={{ ...th, textAlign: "center" as const }}>Promo</th>
                <th style={{ ...th, textAlign: "right" as const }}>Fraud Probability</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((row, i) => {
                const score = row.risk_score;
                return (
                  <tr
                    key={row.order_id}
                    style={{ borderBottom: "1px solid #f1f5f9", ...riskStyle(score) }}
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
                    <td style={{ ...td, textAlign: "right", color: "#475569", fontWeight: 500 }}>
                      ${row.order_total.toFixed(2)}
                    </td>
                    <td style={td}>{paymentBadge(row.payment_method)}</td>
                    <td style={{ ...td, color: "#64748b", textTransform: "capitalize" }}>{row.device_type}</td>
                    <td style={{ ...td, color: "#64748b" }}>{row.ip_country}</td>
                    <td style={{ ...td, textAlign: "center" }}>
                      {row.promo_used ? (
                        <span style={{ color: "#d97706", fontWeight: 600, fontSize: "0.8rem" }}>YES</span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem" }}>
                        {row.is_fraud && (
                          <span style={{
                            background: "#fee2e2",
                            color: "#991b1b",
                            border: "1px solid #fca5a5",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                          }}>
                            FLAGGED
                          </span>
                        )}
                        <span style={{
                          color: riskColor(score),
                          fontWeight: 700,
                          fontSize: "1rem",
                        }}>
                          {(score * 100).toFixed(1)}%
                        </span>
                      </div>
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
