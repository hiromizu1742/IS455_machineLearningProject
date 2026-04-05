/**
 * fraudModel.ts
 * ------------
 * Pure TypeScript inference for the calibrated Logistic Regression trained in
 * train_model.py. Parameters are loaded from lib/model_params.json which is
 * bundled with the Next.js build — no Python runtime required on Vercel.
 *
 * Prediction mirrors the sklearn pipeline exactly:
 *   1. Numeric imputation (median) + StandardScaler
 *   2. Categorical imputation (mode) + OneHotEncoder
 *   3. Per-fold LR decision function + Platt scaling
 *   4. Average calibrated probability across CV folds
 *   5. Threshold comparison
 */

import params from "./model_params.json";

// ---- Types ------------------------------------------------------------------

export interface OrderFeatures {
  payment_method: string | null;
  device_type: string | null;
  ip_country: string | null;
  promo_used: number;        // 0 or 1
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
  zip_mismatch: number;      // 0 or 1
  order_hour: number;        // 0–23
  order_dow: number;         // 0=Mon … 6=Sun  (matches Python dayofweek)
  customer_segment: string | null;
  loyalty_tier: string | null;
  gender: string | null;
  customer_age: number;
  customer_tenure_days: number;
  item_count: number;
  total_qty: number;
  avg_unit_price: number;
  max_unit_price: number;
}

export interface FraudPrediction {
  prob: number;      // calibrated fraud probability 0–1
  isFraud: boolean;  // prob >= threshold
}

// ---- Math helpers -----------------------------------------------------------

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ---- Main prediction --------------------------------------------------------

export function predictFraud(features: OrderFeatures): FraudPrediction {
  const { numeric_features, categorical_features,
          numeric_medians, numeric_means, numeric_scales,
          categorical_modes, categorical_categories,
          threshold, calibrated_classifiers } = params;

  const featureMap = features as unknown as Record<string, number | string | null>;

  // 1. Numeric vector: impute then StandardScale
  const numVec: number[] = numeric_features.map((feat, i) => {
    const raw = featureMap[feat];
    const val = (raw == null || typeof raw !== "number" || isNaN(raw as number))
      ? numeric_medians[i]
      : (raw as number);
    return (val - numeric_means[i]) / numeric_scales[i];
  });

  // 2. Categorical vector: impute then OneHotEncode
  const catVec: number[] = [];
  categorical_features.forEach((feat, i) => {
    const raw = featureMap[feat];
    const val = (raw == null) ? categorical_modes[i] : String(raw);
    (categorical_categories[i] as string[]).forEach(cat =>
      catVec.push(val === cat ? 1 : 0)
    );
  });

  // 3. Combined preprocessed feature vector
  const X = [...numVec, ...catVec];

  // 4. Average Platt-calibrated probability across all CV-fold classifiers
  //    sklearn's _SigmoidCalibration.predict: expit(-(a * f + b))
  let sumProb = 0;
  for (const cc of calibrated_classifiers) {
    let f = cc.intercept;
    for (let j = 0; j < X.length; j++) f += cc.coef[j] * X[j];
    sumProb += sigmoid(-(cc.platt_a * f + cc.platt_b));
  }
  const prob = sumProb / calibrated_classifiers.length;

  return { prob, isFraud: prob >= threshold };
}

// ---- Batch scoring ----------------------------------------------------------

export interface RawOrderRow {
  order_id: number;
  payment_method: string;
  device_type: string;
  ip_country: string;
  promo_used: boolean | number;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
  billing_zip: string | null;
  shipping_zip: string | null;
  order_datetime: string;
  customer_segment: string | null;
  loyalty_tier: string | null;
  gender: string | null;
  birthdate: string;
  customer_created_at: string;
  item_count: number | null;
  total_qty: number | null;
  avg_unit_price: number | null;
  max_unit_price: number | null;
}

/**
 * Derive engineered features from a raw DB row and run fraud prediction.
 * Feature engineering mirrors the notebook's Python code exactly.
 */
export function scoreOrder(row: RawOrderRow): { order_id: number; risk_score: number; is_fraud: boolean } {
  const orderDt     = new Date(row.order_datetime);
  const birthDt     = new Date(row.birthdate);
  const createdAtDt = new Date(row.customer_created_at);

  const order_hour = orderDt.getUTCHours();

  // JavaScript getUTCDay(): 0=Sun … 6=Sat
  // Python dayofweek:        0=Mon … 6=Sun
  const jsDow  = orderDt.getUTCDay();
  const order_dow = jsDow === 0 ? 6 : jsDow - 1;

  const zip_mismatch =
    row.billing_zip && row.shipping_zip && row.billing_zip !== row.shipping_zip ? 1 : 0;

  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  const msPerDay  = 24 * 60 * 60 * 1000;
  const customer_age          = (orderDt.getTime() - birthDt.getTime()) / msPerYear;
  const customer_tenure_days  = (orderDt.getTime() - createdAtDt.getTime()) / msPerDay;

  const features: OrderFeatures = {
    payment_method:       row.payment_method,
    device_type:          row.device_type,
    ip_country:           row.ip_country,
    promo_used:           row.promo_used ? 1 : 0,
    order_subtotal:       row.order_subtotal,
    shipping_fee:         row.shipping_fee,
    tax_amount:           row.tax_amount,
    order_total:          row.order_total,
    zip_mismatch,
    order_hour,
    order_dow,
    customer_segment:     row.customer_segment,
    loyalty_tier:         row.loyalty_tier,
    gender:               row.gender,
    customer_age:         Math.round(customer_age * 10) / 10,
    customer_tenure_days: Math.floor(customer_tenure_days),
    item_count:           row.item_count    ?? 0,
    total_qty:            row.total_qty     ?? 0,
    avg_unit_price:       row.avg_unit_price ?? 0,
    max_unit_price:       row.max_unit_price ?? 0,
  };

  const { prob, isFraud } = predictFraud(features);
  return { order_id: row.order_id, risk_score: prob, is_fraud: isFraud };
}
