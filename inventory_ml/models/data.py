import warnings
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from config import supabase

warnings.filterwarnings("ignore", message=".*will drop timezone information.*")


def fetch_out_movements() -> pd.DataFrame:
    resp = supabase.table("stock_movements") \
        .select("sparepart_id, branch_id, quantity, created_at") \
        .eq("type", "out") \
        .order("created_at", desc=True) \
        .limit(5000) \
        .execute()
    rows = resp.data or []
    if not rows:
        return pd.DataFrame()
    df = pd.DataFrame(rows)
    df["created_at"] = pd.to_datetime(df["created_at"], format="mixed", utc=True)
    df["month"] = df["created_at"].dt.to_period("M").astype(str)
    df["quantity"] = df["quantity"].abs()
    return df


def fetch_spareparts() -> pd.DataFrame:
    resp = supabase.table("spareparts") \
        .select("id, name, code, price, lead_time, category_id, is_active") \
        .eq("is_active", True) \
        .execute()
    rows = resp.data or []
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def fetch_branch_stocks() -> pd.DataFrame:
    resp = supabase.table("branch_stocks") \
        .select("sparepart_id, branch_id, quantity") \
        .execute()
    rows = resp.data or []
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def fetch_forecast_params() -> dict:
    params = {}
    try:
        resp = supabase.table("settings") \
            .select("key, value") \
            .is_("branch_id", "null") \
            .in_("key", ["service_level_z", "holding_cost_pct"]) \
            .execute()
        for row in (resp.data or []):
            val = row["value"]
            if isinstance(val, str):
                val = val.strip()
            if val is not None:
                params[row["key"]] = float(val)
    except Exception:
        pass
    return params


def fetch_branches() -> pd.DataFrame:
    resp = supabase.table("branches") \
        .select("id, name, code, city") \
        .eq("is_active", True) \
        .execute()
    rows = resp.data or []
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def build_features(movements: pd.DataFrame, spareparts: pd.DataFrame) -> pd.DataFrame:
    if movements.empty:
        return pd.DataFrame()

    monthly = movements.groupby(["sparepart_id", "branch_id", "month"])["quantity"] \
        .sum() \
        .abs() \
        .reset_index()
    monthly.rename(columns={"quantity": "demand"}, inplace=True)
    monthly["month_dt"] = pd.to_datetime(monthly["month"] + "-01")

    monthly.sort_values(["sparepart_id", "branch_id", "month_dt"], inplace=True)

    monthly["lag_1"] = monthly.groupby(["sparepart_id", "branch_id"])["demand"].shift(1).fillna(0)
    monthly["lag_2"] = monthly.groupby(["sparepart_id", "branch_id"])["demand"].shift(2).fillna(0)
    monthly["lag_3"] = monthly.groupby(["sparepart_id", "branch_id"])["demand"].shift(3).fillna(0)
    monthly["rolling_mean_3"] = monthly.groupby(["sparepart_id", "branch_id"])["demand"] \
        .transform(lambda x: x.rolling(3, min_periods=1).mean()).fillna(0)

    monthly["month_num"] = monthly["month_dt"].dt.month
    monthly["month_sin"] = np.sin(2 * np.pi * monthly["month_num"] / 12)
    monthly["month_cos"] = np.cos(2 * np.pi * monthly["month_num"] / 12)
    monthly["quarter"] = monthly["month_dt"].dt.quarter

    price_map = spareparts.set_index("id")["price"].to_dict()
    monthly["price"] = monthly["sparepart_id"].map(price_map).fillna(0)

    sparepart_demand = monthly.groupby("sparepart_id")["demand"].mean().to_dict()
    monthly["sparepart_encoded"] = monthly["sparepart_id"].map(sparepart_demand).fillna(0)

    branch_demand = monthly.groupby("branch_id")["demand"].mean().to_dict()
    monthly["branch_encoded"] = monthly["branch_id"].map(branch_demand).fillna(0)

    return monthly.reset_index(drop=True)


def get_prediction_dates(period_start: str, period_end: str) -> list:
    start = pd.Timestamp(period_start)
    end = pd.Timestamp(period_end)
    dates = []
    cursor = start.replace(day=1)
    while cursor <= end:
        dates.append(cursor.strftime("%Y-%m-%d"))
        next_m = cursor.month + 1
        cursor = cursor.replace(year=cursor.year + (next_m - 1) // 12,
                                month=(next_m - 1) % 12 + 1)
    return dates


def build_prediction_features(
    sparepart_id: str,
    branch_id: str,
    future_months: list,
    spareparts: pd.DataFrame,
    monthly_history: pd.DataFrame,
) -> pd.DataFrame:
    rows = []
    hist = monthly_history[
        (monthly_history["sparepart_id"] == sparepart_id) &
        (monthly_history["branch_id"] == branch_id)
        ].sort_values("month_dt")

    if hist.empty:
        return pd.DataFrame()

    last_lag1 = hist["demand"].iloc[-1]
    last_lag2 = hist["demand"].iloc[-2] if len(hist) >= 2 else last_lag1
    last_lag3 = hist["demand"].iloc[-3] if len(hist) >= 3 else last_lag2
    rolling = hist["demand"].tail(3).mean()

    price = spareparts.loc[spareparts["id"] == sparepart_id, "price"].values
    price_val = price[0] if len(price) else 0
    sparepart_enc = hist["sparepart_encoded"].iloc[-1] if not hist.empty else 0
    branch_enc = hist["branch_encoded"].iloc[-1] if not hist.empty else 0

    for i, m in enumerate(future_months):
        dt = pd.Timestamp(m)
        row = {
            "sparepart_id": sparepart_id,
            "branch_id": branch_id,
            "month": m,
            "lag_1": last_lag1 if i == 0 else rows[i - 1]["predicted"],
            "lag_2": last_lag2 if i == 0 else rows[i - 1]["lag_1"],
            "lag_3": last_lag3 if i == 0 else rows[i - 1]["lag_2"],
            "rolling_mean_3": rolling,
            "month_num": dt.month,
            "month_sin": np.sin(2 * np.pi * dt.month / 12),
            "month_cos": np.cos(2 * np.pi * dt.month / 12),
            "quarter": dt.quarter,
            "price": price_val,
            "sparepart_encoded": sparepart_enc,
            "branch_encoded": branch_enc,
            "predicted": 0,
        }
        rows.append(row)

    result = pd.DataFrame(rows)
    result.drop(columns=["predicted"], inplace=True)
    return result
