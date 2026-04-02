#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import sqlite3
from pathlib import Path


TABLE_ORDER = [
    "customers",
    "products",
    "orders",
    "product_reviews",
    "order_items",
    "shipments",
]

BOOLEAN_COLS = {"is_active", "promo_used", "is_fraud", "late_delivery"}


def quote_value(value, as_boolean: bool = False) -> str:
    if value is None:
        return "NULL"
    if as_boolean:
        return "TRUE" if int(value) != 0 else "FALSE"
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    return str(value)


def render_insert_block(table: str, col_names: list[str], rows: list[tuple]) -> str:
    values_sql = []
    for row in rows:
        vals = []
        for i, value in enumerate(row):
            col = col_names[i]
            vals.append(quote_value(value, as_boolean=(col in BOOLEAN_COLS)))
        values_sql.append(f"  ({', '.join(vals)})")

    return "\n".join(
        [
            f"INSERT INTO public.{table} ({', '.join(col_names)}) VALUES",
            ",\n".join(values_sql) + ";",
        ]
    )


def write_data_file(
    out_dir: Path,
    file_index: int,
    blocks: list[tuple[str, list[str], list[tuple]]],
) -> int:
    statements = [render_insert_block(t, cols, rows) for t, cols, rows in blocks]
    content = "\n".join(
        [
            "-- Auto-generated chunk for Supabase SQL Editor",
            "BEGIN;",
            "",
            "\n\n".join(statements),
            "",
            "COMMIT;",
            "",
        ]
    )

    file_path = out_dir / f"{file_index:02d}_seed_part.sql"
    file_path.write_text(content, encoding="utf-8")
    return file_index + 1


def main():
    parser = argparse.ArgumentParser(
        description="Split SQLite seed data into small Supabase SQL files."
    )
    parser.add_argument("--db", type=Path, default=Path("shop.db"))
    parser.add_argument("--out", type=Path, default=Path("supabase/seed_chunks"))
    parser.add_argument(
        "--rows-per-file",
        type=int,
        default=1000,
        help="Max number of rows per output SQL file (default: 1000).",
    )
    parser.add_argument(
        "--data-files",
        type=int,
        default=0,
        help=(
            "Fixed number of data files before setval file. "
            "When set (>0), rows are distributed across this many files."
        ),
    )
    args = parser.parse_args()

    if not args.db.exists():
        raise SystemExit(f"Database not found: {args.db}")

    args.out.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(args.db))
    try:
        file_index = 1
        identity_map: list[tuple[str, str]] = []
        table_rows: dict[str, list[tuple]] = {}
        table_cols: dict[str, list[str]] = {}
        total_rows = 0

        for table in TABLE_ORDER:
            cols = conn.execute(f"PRAGMA table_info({table})").fetchall()
            col_names = [c[1] for c in cols]
            table_cols[table] = col_names
            for c in cols:
                if c[5] == 1 and "INT" in (c[2] or "").upper():
                    identity_map.append((table, c[1]))

            rows = conn.execute(f"SELECT * FROM {table}").fetchall()
            table_rows[table] = rows
            total_rows += len(rows)

        if args.data_files > 0:
            rows_per_file = max(1, math.ceil(total_rows / args.data_files))
        else:
            rows_per_file = args.rows_per_file

        current_blocks: list[tuple[str, list[str], list[tuple]]] = []
        current_count = 0

        for table in TABLE_ORDER:
            rows = table_rows[table]
            cols = table_cols[table]
            start = 0
            while start < len(rows):
                remaining = rows_per_file - current_count
                if remaining <= 0:
                    file_index = write_data_file(args.out, file_index, current_blocks)
                    current_blocks = []
                    current_count = 0
                    remaining = rows_per_file

                end = min(start + remaining, len(rows))
                slice_rows = rows[start:end]
                current_blocks.append((table, cols, slice_rows))
                current_count += len(slice_rows)
                start = end

                if current_count >= rows_per_file:
                    file_index = write_data_file(args.out, file_index, current_blocks)
                    current_blocks = []
                    current_count = 0

        if current_blocks:
            file_index = write_data_file(args.out, file_index, current_blocks)

        setval_lines = [
            "-- Reset identity sequences to current max IDs",
            "BEGIN;",
            "",
        ]
        for table, col in identity_map:
            setval_lines.append(
                "SELECT setval("
                f"pg_get_serial_sequence('public.{table}', '{col}'), "
                f"COALESCE((SELECT MAX({col}) FROM public.{table}), 1), true"
                ");"
            )
        setval_lines.extend(["", "COMMIT;", ""])
        (args.out / f"{file_index:02d}_setval.sql").write_text(
            "\n".join(setval_lines), encoding="utf-8"
        )
    finally:
        conn.close()

    print(f"Wrote seed chunks in: {args.out}")


if __name__ == "__main__":
    main()
