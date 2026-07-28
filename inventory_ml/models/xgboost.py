import json
import os
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit

from config import MODEL_PATH, METRICS_PATH
from models.metrics import compute_all


TUNE_PARAMS = {
    "max_depth": {"default": 6, "min": 2, "max": 12, "step": 1, "desc": "Kedalaman pohon. Nilai besar → model kompleks, risiko overfitting."},
    "learning_rate": {"default": 0.08, "min": 0.01, "max": 0.5, "step": 0.01, "desc": "Langkah koreksi tiap iterasi. Kecil → lebih teliti butuh lebih banyak rounds."},
    "subsample": {"default": 0.8, "min": 0.3, "max": 1.0, "step": 0.05, "desc": "Fraksi sampel per pohon. Kecil → lebih random, kurangi overfitting."},
    "colsample_bytree": {"default": 0.8, "min": 0.3, "max": 1.0, "step": 0.05, "desc": "Fraksi fitur per pohon. Kecil → tiap pohon lihat subset fitur berbeda."},
    "min_child_weight": {"default": 1, "min": 1, "max": 10, "step": 1, "desc": "Minimal sampel per leaf. Naikkan untuk cegah overfitting."},
    "gamma": {"default": 0, "min": 0, "max": 5, "step": 0.1, "desc": "Minimal loss reduction untuk split. Filter split tidak signifikan."},
    "reg_alpha": {"default": 0, "min": 0, "max": 10, "step": 0.5, "desc": "Regularisasi L1. Membuat model lebih sparse."},
    "reg_lambda": {"default": 1, "min": 0, "max": 10, "step": 0.5, "desc": "Regularisasi L2. Bobot lebih kecil → model lebih stabil."},
}

def train_model(features: pd.DataFrame, **overrides) -> dict:
    feature_cols = [
        "lag_1", "lag_2", "lag_3", "rolling_mean_3",
        "month_sin", "month_cos", "quarter",
        "price", "sparepart_encoded", "branch_encoded",
    ]

    for c in feature_cols:
        if c not in features.columns:
            features[c] = 0

    X = features[feature_cols].fillna(0)
    y = features["demand"].fillna(0)

    sort_idx = features["month_dt"].argsort()
    X = X.iloc[sort_idx]
    y = y.iloc[sort_idx]

    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    if len(X_train) < 10:
        X_train, X_test = X, X.iloc[:max(1, len(X) // 5)]
        y_train, y_test = y, y.iloc[:max(1, len(y) // 5)]

    params = {"n_estimators": 300, "random_state": 42, "early_stopping_rounds": 20, "eval_metric": "rmse", "verbosity": 0}
    for k, v in TUNE_PARAMS.items():
        params[k] = overrides.get(k, v["default"])

    model = xgb.XGBRegressor(**params)

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_pred = model.predict(X_test)
    metrics = compute_all(y_test.values, y_pred)

    feature_importance = []
    for name, val in zip(feature_cols, model.feature_importances_):
        feature_importance.append({"feature": name, "importance": round(float(val), 4)})
    feature_importance.sort(key=lambda x: x["importance"], reverse=True)

    model.save_model(MODEL_PATH)

    metrics_data = {
        "metrics": metrics,
        "feature_importance": feature_importance,
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "training_date": pd.Timestamp.now().isoformat(),
    }
    os.makedirs(os.path.dirname(METRICS_PATH), exist_ok=True)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_data, f, indent=2)

    return metrics_data


def load_model():
    if not os.path.exists(MODEL_PATH):
        return None
    model = xgb.XGBRegressor()
    model.load_model(MODEL_PATH)
    return model


def predict_future(features_df: pd.DataFrame, model) -> np.ndarray:
    feature_cols = [
        "lag_1", "lag_2", "lag_3", "rolling_mean_3",
        "month_sin", "month_cos", "quarter",
        "price", "sparepart_encoded", "branch_encoded",
    ]

    for c in feature_cols:
        if c not in features_df.columns:
            features_df[c] = 0

    X = features_df[feature_cols].fillna(0)
    return model.predict(X)
