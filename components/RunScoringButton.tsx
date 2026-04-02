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
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
      <button
        onClick={handleRun}
        disabled={loading}
        style={{
          background: loading ? "#888" : "#c0392b",
          color: "white",
          border: "none",
          padding: "0.65rem 1.4rem",
          borderRadius: "6px",
          fontSize: "1rem",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Running ML Scoring..." : "Run Scoring"}
      </button>
      {result && (
        <span style={{ color: result.ok ? "green" : "red", fontSize: "0.9rem" }}>
          {result.msg}
        </span>
      )}
    </div>
  );
}
