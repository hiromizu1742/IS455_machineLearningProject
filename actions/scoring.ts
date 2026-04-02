"use server";
import { execSync } from "child_process";
import path from "path";

export async function runScoring(): Promise<{
  success: boolean;
  message: string;
}> {
  const apiUrl = process.env.ML_API_URL;

  // Pattern 1: Call external ML API if ML_API_URL is set in .env.local
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Adjust the request body to match your teammate's API spec
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `API error ${res.status}: ${text}` };
      }

      const data = await res.json().catch(() => ({}));
      const count = data.count ?? data.scored ?? "unknown";
      return { success: true, message: `Scoring complete via API. Scored: ${count}` };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `API call failed: ${msg}` };
    }
  }

  // Pattern 2: Fall back to local Python script if no API URL is configured
  try {
    execSync("python3 scoring_script.py", {
      cwd: path.join(process.cwd()),
      timeout: 120_000,
      stdio: "pipe",
    });
    return { success: true, message: "Scoring complete (local script). Queue refreshed." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Scoring script failed.";
    return { success: false, message: msg };
  }
}
