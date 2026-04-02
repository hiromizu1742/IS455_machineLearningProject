"""
scoring_script.py
-----------------
Placeholder ML scoring script.
Replace the predict() function with your trained model from the Jupyter notebook.

The web app reads `late_delivery_prob` from the `shipments` table.
This script computes predictions and writes them back to shop.db.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shop.db")


# ---------------------------------------------------------------------------
# Replace this function with your actual trained model
# Example: return model.predict_proba([features])[0][1]
# ---------------------------------------------------------------------------
def predict(row: dict) -> float:
    """
    Placeholder heuristic — swap this out with your real model inference.

    Available row keys:
        shipment_id, order_id, carrier, shipping_method, distance_band,
        promised_days, actual_days,
        payment_method, device_type, ip_country, promo_used, order_total,
        customer_segment, loyalty_tier
    """
    base = {"standard": 0.65, "expedited": 0.35, "overnight": 0.15}.get(
        row["shipping_method"], 0.5
    )
    dist = {"national": 0.20, "regional": 0.10, "local": 0.0}.get(
        row["distance_band"], 0.0
    )
    carrier_adj = {"USPS": 0.05, "UPS": 0.0, "FedEx": -0.05}.get(row["carrier"], 0.0)
    return min(max(base + dist + carrier_adj, 0.0), 1.0)
# ---------------------------------------------------------------------------


def run():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # Add column if it does not exist yet
    try:
        conn.execute("ALTER TABLE shipments ADD COLUMN late_delivery_prob REAL")
        conn.commit()
    except sqlite3.OperationalError:
        pass  # Column already exists

    # Fetch all shipments joined with order and customer features
    rows = conn.execute("""
        SELECT
            s.shipment_id, s.order_id, s.carrier, s.shipping_method,
            s.distance_band, s.promised_days, s.actual_days,
            o.payment_method, o.device_type, o.ip_country,
            o.promo_used, o.order_total,
            c.customer_segment, c.loyalty_tier
        FROM shipments s
        JOIN orders o ON s.order_id = o.order_id
        JOIN customers c ON o.customer_id = c.customer_id
    """).fetchall()

    # Compute predictions and batch update
    updates = [(predict(dict(row)), row["shipment_id"]) for row in rows]
    conn.executemany(
        "UPDATE shipments SET late_delivery_prob = ? WHERE shipment_id = ?",
        updates,
    )
    conn.commit()
    conn.close()
    print(f"Scored {len(updates)} shipments.")


if __name__ == "__main__":
    run()
