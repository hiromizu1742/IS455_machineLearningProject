import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath =
      process.env.DB_PATH ?? path.join(process.cwd(), "shop.db");
    db = new Database(dbPath, { fileMustExist: true });
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Add late_delivery_prob column if it does not exist yet
    const cols = db.pragma("table_info(shipments)") as { name: string }[];
    if (!cols.some((c) => c.name === "late_delivery_prob")) {
      db.exec("ALTER TABLE shipments ADD COLUMN late_delivery_prob REAL");
    }
  }
  return db;
}
