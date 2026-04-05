import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      ok: false,
      error: "DATABASE_URL is not set in environment variables",
      hint: "Go to Vercel Dashboard → Project → Settings → Environment Variables",
    }, { status: 503 });
  }

  // Mask credentials for safe display
  const masked = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    const result = await pool.query("SELECT NOW() AS time, current_database() AS db");
    await pool.end();
    return NextResponse.json({
      ok: true,
      db: result.rows[0].db,
      time: result.rows[0].time,
      url: masked,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok: false,
      error: message,
      url: masked,
      hint: message.includes("ECONNREFUSED") || message.includes("timeout")
        ? "Supabase project may be paused. Visit your Supabase dashboard and resume it."
        : message.includes("password") || message.includes("authentication")
        ? "DATABASE_URL credentials are wrong. Check Supabase → Settings → Database → Connection string."
        : "Unknown connection error.",
    }, { status: 503 });
  }
}
