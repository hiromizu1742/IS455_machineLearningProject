"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/customers",     label: "Customers" },
  { href: "/priority-queue", label: "Priority Queue" },
  { href: "/fraud-alerts",  label: "Fraud Alerts" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            style={{
              color: active ? "#ffffff" : "#94b8d8",
              textDecoration: "none",
              fontSize: "0.95rem",
              fontWeight: active ? 600 : 400,
              paddingBottom: "2px",
              borderBottom: active ? "2px solid #4f8ef7" : "2px solid transparent",
              transition: "color 0.15s",
            }}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
