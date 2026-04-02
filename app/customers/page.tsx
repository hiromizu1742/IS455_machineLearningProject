import { getCustomers } from "@/actions/customers";
import Link from "next/link";

const PER_PAGE = 15;

const tierStyle: Record<string, React.CSSProperties> = {
  Gold:     { background: "#fef3c7", color: "#92400e" },
  Silver:   { background: "#f1f5f9", color: "#475569" },
  Bronze:   { background: "#fff7ed", color: "#9a3412" },
  Platinum: { background: "#f0f4ff", color: "#3730a3" },
};

const segmentStyle: Record<string, React.CSSProperties> = {
  Premium:  { background: "#ede9fe", color: "#5b21b6" },
  Standard: { background: "#f0f9ff", color: "#0369a1" },
  Budget:   { background: "#f0fdf4", color: "#166534" },
};

function Badge({ label, styles }: { label: string; styles: Record<string, React.CSSProperties> }) {
  const style = styles[label] ?? { background: "#f1f5f9", color: "#475569" };
  return (
    <span style={{
      ...style,
      padding: "2px 10px",
      borderRadius: "9999px",
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const customers = await getCustomers();

  const totalPages = Math.ceil(customers.length / PER_PAGE);
  const page = Math.min(Math.max(Number(pageParam) || 1, 1), totalPages);
  const start = (page - 1) * PER_PAGE;
  const pageCustomers = customers.slice(start, start + PER_PAGE);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>Customers</h1>
        <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
          {customers.length} active customers — click a row to open the dashboard
        </p>
      </div>

      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={th}>Name</th>
              <th style={th}>Segment</th>
              <th style={th}>Loyalty</th>
              <th style={th}>Location</th>
              <th style={{ ...th, width: "48px" }}></th>
            </tr>
          </thead>
          <tbody>
            {pageCustomers.map((c) => (
              <tr
                key={c.customer_id}
                className="table-row"
                style={{ borderBottom: "1px solid #f1f5f9" }}
              >
                <td style={td}>
                  <Link href={`/customers/${c.customer_id}`} style={{ display: "block", color: "inherit" }}>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>{c.full_name}</span>
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{c.email}</span>
                  </Link>
                </td>
                <td style={td}>
                  {c.customer_segment
                    ? <Badge label={c.customer_segment} styles={segmentStyle} />
                    : <span style={{ color: "#cbd5e1" }}>—</span>}
                </td>
                <td style={td}>
                  {c.loyalty_tier
                    ? <Badge label={c.loyalty_tier} styles={tierStyle} />
                    : <span style={{ color: "#cbd5e1" }}>—</span>}
                </td>
                <td style={{ ...td, color: "#64748b" }}>
                  {c.city ?? "—"}
                </td>
                <td style={td}>
                  <Link
                    href={`/customers/${c.customer_id}`}
                    style={{ color: "#4f8ef7", fontSize: "1.1rem", display: "block", textAlign: "center" }}
                    aria-label={`Open ${c.full_name}`}
                  >
                    →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          borderTop: "1px solid #e2e8f0",
          background: "#f8fafc",
        }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            {start + 1}–{Math.min(start + PER_PAGE, customers.length)} / {customers.length} 件
          </span>

          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <PaginationLink href={`?page=${page - 1}`} disabled={page <= 1}>
              ← 前へ
            </PaginationLink>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} style={{ color: "#94a3b8", padding: "0 0.25rem" }}>…</span>
                ) : (
                  <PaginationLink key={item} href={`?page=${item}`} active={item === page}>
                    {item}
                  </PaginationLink>
                )
              )}

            <PaginationLink href={`?page=${page + 1}`} disabled={page >= totalPages}>
              次へ →
            </PaginationLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  children,
  disabled,
  active,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  if (disabled) {
    return (
      <span style={{
        padding: "0.35rem 0.65rem",
        borderRadius: "6px",
        fontSize: "0.85rem",
        color: "#cbd5e1",
        cursor: "default",
      }}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      style={{
        padding: "0.35rem 0.65rem",
        borderRadius: "6px",
        fontSize: "0.85rem",
        fontWeight: active ? 700 : 400,
        background: active ? "#1a1a2e" : "transparent",
        color: active ? "#fff" : "#475569",
        border: active ? "none" : "1px solid #e2e8f0",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}

const th: React.CSSProperties = {
  padding: "0.75rem 1.25rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#64748b",
};

const td: React.CSSProperties = {
  padding: "0.85rem 1.25rem",
  verticalAlign: "middle",
};
