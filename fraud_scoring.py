"""
fraud_scoring.py
----------------
Loads the trained model (model.sav) and scores all orders in shop.db,
writing risk_score and is_fraud back to the orders table.

Run this locally after train_model.py to pre-populate scores before
re-seeding Supabase, or run it against Supabase directly via DATABASE_URL.

Usage:
    python fraud_scoring.py                        # scores shop.db
    DATABASE_URL=postgresql://... python fraud_scoring.py  # scores Supabase
"""

import os
import sqlite3

import joblib
import numpy as np
import pandas as pd

DIR        = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(DIR, "shop.db")
MODEL_PATH = os.path.join(DIR, "model.sav")


def load_orders(conn) -> pd.DataFrame:
    return pd.read_sql("""
        SELECT
            o.order_id,
            o.payment_method,
            o.device_type,
            o.ip_country,
            o.promo_used,
            o.order_subtotal,
            o.shipping_fee,
            o.tax_amount,
            o.order_total,
            o.billing_zip,
            o.shipping_zip,
            o.order_datetime,
            c.customer_segment,
            c.loyalty_tier,
            c.gender,
            c.birthdate,
            c.created_at AS customer_created_at,
            oi.item_count,
            oi.total_qty,
            oi.avg_unit_price,
            oi.max_unit_price
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        LEFT JOIN (
            SELECT
                order_id,
                COUNT(*)        AS item_count,
                SUM(quantity)   AS total_qty,
                AVG(unit_price) AS avg_unit_price,
                MAX(unit_price) AS max_unit_price
            FROM order_items
            GROUP BY order_id
        ) oi ON o.order_id = oi.order_id
    """, conn)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["order_datetime"]      = pd.to_datetime(df["order_datetime"])
    df["birthdate"]           = pd.to_datetime(df["birthdate"])
    df["customer_created_at"] = pd.to_datetime(df["customer_created_at"])

    df["order_hour"] = df["order_datetime"].dt.hour
    df["order_dow"]  = df["order_datetime"].dt.dayofweek
    df["zip_mismatch"] = np.where(
        df["billing_zip"].notna() & df["shipping_zip"].notna(),
        (df["billing_zip"] != df["shipping_zip"]).astype(int),
        0,
    )
    df["customer_age"]         = ((df["order_datetime"] - df["birthdate"]).dt.days / 365.25).round(1)
    df["customer_tenure_days"] = (df["order_datetime"] - df["customer_created_at"]).dt.days
    return df


FEATURE_COLS = [
    "payment_method", "device_type", "ip_country", "promo_used",
    "order_subtotal", "shipping_fee", "tax_amount", "order_total",
    "zip_mismatch", "order_hour", "order_dow",
    "customer_segment", "loyalty_tier", "gender",
    "customer_age", "customer_tenure_days",
    "item_count", "total_qty", "avg_unit_price", "max_unit_price",
]


def run() -> None:
    print("Loading model...")
    artifact  = joblib.load(MODEL_PATH)
    pipeline  = artifact["pipeline"]
    threshold = artifact["threshold"]
    print(f"  Threshold: {threshold}\n")

    print("Connecting to database...")
    db_url = os.environ.get("DATABASE_URL")

    if db_url:
        # Postgres (Supabase)
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(db_url)
        df = pd.read_sql("""...""", conn)  # reuse load_orders query above
        # For simplicity, use the SQLite path and push manually if needed
        print("  (Postgres path not fully implemented — use the TypeScript webapp for live scoring)")
        conn.close()
        return

    # SQLite (local shop.db)
    conn = sqlite3.connect(DB_PATH)
    df = load_orders(conn)
    df = engineer_features(df)

    X = df[FEATURE_COLS]
    probs = pipeline.predict_proba(X)[:, 1]
    flags = (probs >= threshold).astype(int)

    updates = [
        (float(prob), bool(flag), int(oid))
        for prob, flag, oid in zip(probs, flags, df["order_id"])
    ]

    try:
        conn.execute("ALTER TABLE orders ADD COLUMN risk_score REAL DEFAULT 0")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # column already exists

    try:
        conn.execute("ALTER TABLE orders ADD COLUMN is_fraud INTEGER DEFAULT 0")
        conn.commit()
    except sqlite3.OperationalError:
        pass

    conn.executemany(
        "UPDATE orders SET risk_score = ?, is_fraud = ? WHERE order_id = ?",
        updates,
    )
    conn.commit()
    conn.close()

    flagged = int(flags.sum())
    print(f"Scored {len(updates)} orders — {flagged} flagged as fraud  (threshold={threshold})")


if __name__ == "__main__":
    run()
