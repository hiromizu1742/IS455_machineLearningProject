"use client";
import { useState } from "react";
import { runScoring } from "@/actions/scoring";
import { useRouter } from "next/navigation";

export default function RunScoringButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    const res = await runScoring();
    setResult({ ok: res.success, msg: res.message });
    setLoading(false);
    if (res.success) router.refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
      <button
        onClick={handleRun}
        disabled={loading}
        style={{
          background: loading ? "#94a3b8" : "#e53e3e",
          color: "white",
          border: "none",
          padding: "0.65rem 1.4rem",
          borderRadius: "8px",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          transition: "background 0.15s",
        }}
      >
        {loading ? "Running..." : "▶ Run Scoring"}
      </button>
      {result && (
        <span style={{
          fontSize: "0.8rem",
          fontWeight: 500,
          color: result.ok ? "#16a34a" : "#e53e3e",
        }}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
