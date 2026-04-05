"""
train_model.py
--------------
Replicates the fraud detection pipeline from fraud_detection.ipynb.
Trains a calibrated Logistic Regression on shop.db and saves two artifacts:

  model.sav           – pickled sklearn pipeline (for Python batch scoring)
  lib/model_params.json – extracted parameters for TypeScript/Node.js inference
                         (shipped with the Next.js webapp, no Python at runtime)

Usage:
    python train_model.py
"""

import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedKFold,
    cross_val_predict,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(DIR, "shop.db")
MODEL_PATH  = os.path.join(DIR, "model.sav")
PARAMS_PATH = os.path.join(DIR, "lib", "model_params.json")

NUMERIC_FEATURES = [
    "order_subtotal", "shipping_fee", "tax_amount", "order_total",
    "promo_used", "zip_mismatch", "order_hour", "order_dow",
    "customer_age", "customer_tenure_days",
    "item_count", "total_qty", "avg_unit_price", "max_unit_price",
]

CATEGORICAL_FEATURES = [
    "payment_method", "device_type", "ip_country",
    "customer_segment", "loyalty_tier", "gender",
]


# ---------------------------------------------------------------------------
# Data loading & feature engineering (mirrors notebook exactly)
# ---------------------------------------------------------------------------

def load_data() -> pd.DataFrame:
    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("""
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
            oi.max_unit_price,
            o.is_fraud
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
    conn.close()
    return df


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


# ---------------------------------------------------------------------------
# Pipeline builders
# ---------------------------------------------------------------------------

def build_preprocessor() -> ColumnTransformer:
    numeric_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    categorical_transformer = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([
        ("num", numeric_transformer,     NUMERIC_FEATURES),
        ("cat", categorical_transformer, CATEGORICAL_FEATURES),
    ])


def find_optimal_threshold(probs: np.ndarray, y_true) -> float:
    """Scan decision thresholds and return the F1-maximizing value."""
    best_f1, opt_threshold = 0.0, 0.5
    for t in np.arange(0.01, 0.99, 0.01):
        preds = (probs >= t).astype(int)
        rec  = recall_score(y_true, preds, zero_division=0)
        prec = precision_score(y_true, preds, zero_division=0)
        f1   = 2 * rec * prec / (rec + prec) if (rec + prec) > 0 else 0.0
        if f1 > best_f1:
            best_f1, opt_threshold = f1, round(float(t), 2)
    return opt_threshold


# ---------------------------------------------------------------------------
# JSON export for TypeScript (Node.js inference — no Python at runtime)
# ---------------------------------------------------------------------------

def export_model_params(best_model, opt_threshold: float, output_path: str) -> None:
    """
    Extract all parameters needed to replicate sklearn inference in TypeScript:
      - Preprocessing stats (medians, means, scales, OHE categories)
      - Per-fold calibrated LR coefficients + Platt-scaling constants
      - Decision threshold

    TypeScript prediction (see lib/fraudModel.ts):
      1. Scale numeric: (x - mean) / scale
      2. OHE categoricals: one column per category, 1 if match else 0
      3. For each of the 5 calibrated classifiers:
            f    = coef · x + intercept
            prob = 1 / (1 + exp(platt_a * f + platt_b))
      4. Average probs across classifiers
      5. Flag as fraud if avg_prob >= threshold
    """
    prep = best_model.named_steps["prep"]
    clf  = best_model.named_steps["clf"]   # CalibratedClassifierCV

    # --- Numeric preprocessing ---
    num_pipe = prep.transformers_[0][1]
    numeric_medians = num_pipe.named_steps["imputer"].statistics_.tolist()
    numeric_means   = num_pipe.named_steps["scaler"].mean_.tolist()
    numeric_scales  = num_pipe.named_steps["scaler"].scale_.tolist()

    # --- Categorical preprocessing ---
    cat_pipe = prep.transformers_[1][1]
    cat_modes      = cat_pipe.named_steps["imputer"].statistics_.tolist()
    cat_categories = [cats.tolist() for cats in cat_pipe.named_steps["encoder"].categories_]

    # --- Calibrated classifiers (one per CV fold) ---
    calibrated_classifiers = []
    for cc in clf.calibrated_classifiers_:
        # sklearn >= 1.2 uses .estimator; older uses .base_estimator
        estimator = getattr(cc, "estimator", None) or getattr(cc, "base_estimator", None)
        calibrator = cc.calibrators[0]  # binary → single calibrator
        calibrated_classifiers.append({
            "coef":      estimator.coef_[0].tolist(),
            "intercept": float(estimator.intercept_[0]),
            "platt_a":   float(calibrator.a_),
            "platt_b":   float(calibrator.b_),
        })

    params = {
        "numeric_features":       NUMERIC_FEATURES,
        "categorical_features":   CATEGORICAL_FEATURES,
        "numeric_medians":        numeric_medians,
        "numeric_means":          numeric_means,
        "numeric_scales":         numeric_scales,
        "categorical_modes":      cat_modes,
        "categorical_categories": cat_categories,
        "threshold":              opt_threshold,
        "calibrated_classifiers": calibrated_classifiers,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(params, f, indent=2)

    print(f"Model params exported → {output_path}")
    n_coef = len(calibrated_classifiers[0]["coef"])
    print(f"  {len(calibrated_classifiers)} calibrated classifiers × {n_coef} features each")
    print(f"  Categories per categorical feature:")
    for feat, cats in zip(CATEGORICAL_FEATURES, cat_categories):
        print(f"    {feat}: {len(cats)}")


# ---------------------------------------------------------------------------
# Main training routine
# ---------------------------------------------------------------------------

def train() -> None:
    print("=== Fraud Detection Model Training ===\n")

    print("Loading data from shop.db...")
    df = engineer_features(load_data())
    all_features = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X = df[all_features]
    y = df["is_fraud"].astype(int)
    print(f"  {len(df):,} orders | {y.sum()} fraud ({y.mean()*100:.1f}%)\n")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # --- Grid search to find best hyperparameters ---
    # Fraud detection requires high recall → score on recall, not AUC.
    # class_weight='balanced' is essential given the 6.4% fraud rate.
    print("Running GridSearchCV (recall)...")
    lr_pipeline = Pipeline([
        ("prep", build_preprocessor()),
        ("clf",  LogisticRegression(max_iter=1000, random_state=42)),
    ])
    param_grid = {
        "clf__C":            [0.01, 0.1, 1, 10],
        "clf__solver":       ["liblinear"],
        "clf__class_weight": ["balanced"],   # required for imbalanced fraud data
    }
    grid_search = GridSearchCV(lr_pipeline, param_grid, cv=skf, scoring="recall", n_jobs=-1)
    grid_search.fit(X_train, y_train)
    best_params = grid_search.best_params_
    print(f"  Best CV Recall: {grid_search.best_score_:.4f}")
    print(f"  Best params:    {best_params}\n")

    # --- Calibrated model with Platt scaling ---
    # Use a 75/25 inner split: fit calibrated model on inner-train, find threshold
    # on inner-val (calibrated probabilities), then refit final model on all X_train.
    print("Fitting calibrated Logistic Regression...")
    from sklearn.base import clone as sk_clone
    from sklearn.model_selection import train_test_split as tts

    calib_pipeline_factory = lambda: Pipeline([
        ("prep", build_preprocessor()),
        ("clf",  CalibratedClassifierCV(
            LogisticRegression(
                C=best_params["clf__C"],
                solver=best_params["clf__solver"],
                class_weight=best_params["clf__class_weight"],
                max_iter=1000,
                random_state=42,
            ),
            method="sigmoid",
            cv=5,
        )),
    ])

    # Fit on inner-train, find threshold on inner-val calibrated probs
    X_tr_inner, X_val_inner, y_tr_inner, y_val_inner = tts(
        X_train, y_train, test_size=0.25, stratify=y_train, random_state=0
    )
    threshold_model = calib_pipeline_factory()
    threshold_model.fit(X_tr_inner, y_tr_inner)
    val_probs = threshold_model.predict_proba(X_val_inner)[:, 1]

    print("Finding optimal decision threshold on calibrated validation probabilities...")
    opt_threshold = find_optimal_threshold(val_probs, y_val_inner)
    print(f"  Optimal threshold: {opt_threshold}\n")

    # Final model: fit on all X_train
    best_model = calib_pipeline_factory()
    best_model.fit(X_train, y_train)

    # --- Test set evaluation ---
    y_prob = best_model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= opt_threshold).astype(int)
    print("=== Test Set Performance ===")
    print(f"  ROC-AUC:   {roc_auc_score(y_test, y_prob):.4f}")
    print(f"  Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"  F1:        {f1_score(y_test, y_pred):.4f}\n")

    # --- Save sklearn artifact ---
    joblib.dump({"pipeline": best_model, "threshold": opt_threshold}, MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}  ({os.path.getsize(MODEL_PATH)/1024:.1f} KB)\n")

    # --- Export JSON params for TypeScript inference ---
    export_model_params(best_model, opt_threshold, PARAMS_PATH)


if __name__ == "__main__":
    train()
