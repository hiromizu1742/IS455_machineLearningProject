import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "IS455 Shop Analytics",
  description: "ML-powered shop analytics dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <nav
          style={{
            background: "#1a1a2e",
            color: "white",
            padding: "0.75rem 2rem",
            display: "flex",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
            IS455 Shop
          </span>
          <Link href="/customers" style={{ color: "#aad4f5", textDecoration: "none" }}>
            Customers
          </Link>
          <Link href="/priority-queue" style={{ color: "#aad4f5", textDecoration: "none" }}>
            Priority Queue
          </Link>
        </nav>
        <div style={{ padding: "2rem" }}>{children}</div>
      </body>
    </html>
  );
}
