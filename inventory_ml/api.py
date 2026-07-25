import json
import math
import os
import threading
import uuid
from datetime import datetime, timedelta

import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from apscheduler.schedulers.background import BackgroundScheduler

from config import (
    HOLDING_COST_PCT,
    LAST_PREDICT_PATH,
    METRICS_PATH,
    MODEL_PATH,
    PREDICTION_MONTHS,
    SERVICE_LEVEL_Z,
    supabase,
)
from models.data import (
    build_features,
    build_prediction_features,
    fetch_branch_stocks,
    fetch_branches,
    fetch_forecast_params,
    fetch_out_movements,
    fetch_spareparts,
    get_prediction_dates,
)
from models.xgboost import TUNE_PARAMS, load_model, predict_future, train_model

app = Flask(__name__, static_folder=None)

DASHBOARD_DIR = os.path.join(os.path.dirname(__file__), "dashboard")


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "inventory-ml-xgboost"})


@app.route("/api/metrics")
def get_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            data = json.load(f)
        return jsonify(data)
    return jsonify({"error": "Model not trained yet"}), 400


@app.route("/api/model-stats")
def get_model_stats():
    if not os.path.exists(MODEL_PATH):
        return jsonify({"error": "Model not trained yet"}), 400
    with open(MODEL_PATH) as f:
        model = json.load(f)
    learner = model.get("learner", {})
    attrs = learner.get("attributes", {})
    grad = learner.get("gradient_booster", {})
    gbtree = grad.get("model", {}).get("gbtree_model_param", {})
    return jsonify({
        "best_iteration": int(float(attrs.get("best_iteration", 0))),
        "best_score": round(float(attrs.get("best_score", 0)), 4),
        "num_features": len(learner.get("feature_names", [])),
        "num_trees": int(gbtree.get("num_trees", 0)),
        "features": learner.get("feature_names", []),
    })


@app.route("/api/feature-importance")
def get_feature_importance():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            data = json.load(f)
        return jsonify(data.get("feature_importance", []))
    return jsonify({"error": "Model not trained yet"}), 400


@app.route("/api/predictions")
def get_predictions():
    sparepart_id = request.args.get("sparepart_id")
    branch_id = request.args.get("branch_id")
    limit = int(request.args.get("limit", 200))

    runs = supabase.table("forecast_runs") \
        .select("id") \
        .eq("method", "xgboost") \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    run_ids = [r["id"] for r in (runs.data or [])]
    if not run_ids:
        return jsonify([])

    q = supabase.table("forecast_series") \
        .select("*, spareparts!inner(name,code), branches!inner(name)") \
        .in_("forecast_run_id", run_ids) \
        .order("month", desc=True) \
        .limit(limit)

    if sparepart_id:
        q = q.eq("sparepart_id", sparepart_id)
    if branch_id:
        q = q.eq("branch_id", branch_id)

    resp = q.execute()
    rows = resp.data or []
    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "month": r["month"],
            "predicted_quantity": float(r["predicted_quantity"]),
            "confidence_lower": float(r.get("confidence_lower", 0)),
            "confidence_upper": float(r.get("confidence_upper", 0)),
            "sparepart_name": r.get("spareparts", {}).get("name", ""),
            "sparepart_code": r.get("spareparts", {}).get("code", ""),
            "branch_name": r.get("branches", {}).get("name", ""),
        })
    return jsonify(result)


@app.route("/api/output")
def get_output():
    try:
        sparepart_id = request.args.get("sparepart_id")
        branch_id = request.args.get("branch_id")
        month_from = request.args.get("month_from")
        month_to = request.args.get("month_to")

        spareparts = fetch_spareparts()
        branches = fetch_branches()
        stocks = fetch_branch_stocks()

        bs_map = {}
        if not stocks.empty:
            for _, r in stocks.iterrows():
                key = (r["sparepart_id"], r["branch_id"])
                bs_map[key] = {
                    "current_stock": int(r["quantity"]),
                    "safety_stock": float(r.get("safety_stock", 0)),
                    "reorder_point": float(r.get("reorder_point", 0)),
                    "eoq": float(r.get("eoq", 0)),
                    "max_stock": float(r.get("max_stock", 0)),
                    "min_stock": float(r.get("min_stock", 0)),
                }

        name_map = {}
        code_map = {}
        for _, r in spareparts.iterrows():
            name_map[r["id"]] = r.get("name", "")
            code_map[r["id"]] = r.get("code", "")

        runs = supabase.table("forecast_runs") \
            .select("id") \
            .eq("method", "xgboost") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        run_ids = [r["id"] for r in (runs.data or [])]
        if not run_ids:
            return jsonify([])

        q = supabase.table("forecast_series") \
            .select("*, branches!inner(name)") \
            .in_("forecast_run_id", run_ids) \
            .order("month", desc=False)

        if sparepart_id:
            q = q.eq("sparepart_id", sparepart_id)
        if branch_id:
            q = q.eq("branch_id", branch_id)
        if month_from:
            q = q.gte("month", month_from + "-01")
        if month_to:
            q = q.lte("month", month_to + "-01")

        resp = q.execute()
        monthly_rows = resp.data or []
        if not monthly_rows:
            return jsonify([])

        branch_name_map = {}
        for _, r in branches.iterrows():
            branch_name_map[r["id"]] = r.get("name", "")

        enriched_params = {}
        for r in monthly_rows:
            sp_id = r["sparepart_id"]
            br_id = r["branch_id"]
            key = (sp_id, br_id)
            if key in enriched_params:
                continue
            bs = bs_map.get(key, {})
            enriched_params[key] = {
                "safety_stock": bs.get("safety_stock", 0),
                "reorder_point": bs.get("reorder_point", 0),
                "eoq": bs.get("eoq", 0),
                "max_stock": bs.get("max_stock", 0),
                "min_stock": bs.get("min_stock", 0),
                "current_stock": bs.get("current_stock", 0),
                "name": name_map.get(sp_id, ""),
                "code": code_map.get(sp_id, ""),
                "branch_name": branch_name_map.get(br_id, ""),
            }

        result = []
        for r in monthly_rows:
            sp_id = r["sparepart_id"]
            br_id = r["branch_id"]
            ep = enriched_params.get((sp_id, br_id), {})
            predicted = float(r["predicted_quantity"])
            status = _compute_status(ep["current_stock"], ep["reorder_point"],
                                     ep["max_stock"], ep["safety_stock"])
            result.append({
                "sparepart_id": sp_id,
                "branch_id": br_id,
                "sparepart_name": ep.get("name", ""),
                "sparepart_code": ep.get("code", ""),
                "branch_name": ep.get("branch_name", ""),
                "month": r["month"][:7],
                "current_stock": ep.get("current_stock", 0),
                "predicted_quantity": predicted,
                "confidence_lower": float(r.get("confidence_lower", 0)),
                "confidence_upper": float(r.get("confidence_upper", 0)),
                "safety_stock": ep.get("safety_stock", 0),
                "reorder_point": ep.get("reorder_point", 0),
                "eoq": ep.get("eoq", 0),
                "max_stock": ep.get("max_stock", 0),
                "status": status,
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _compute_status(current_stock, reorder_point, max_stock, safety_stock):
    if current_stock <= reorder_point:
        return "Kritis"
    if current_stock <= reorder_point + safety_stock:
        return "Menipis"
    if current_stock >= max_stock:
        return "Overstock"
    return "Aman"


@app.route("/api/spareparts")
def list_spareparts():
    df = fetch_spareparts()
    return jsonify(df.to_dict(orient="records") if not df.empty else [])


@app.route("/api/branches")
def list_branches():
    df = fetch_branches()
    return jsonify(df.to_dict(orient="records") if not df.empty else [])


@app.route("/api/train-params")
def get_train_params():
    return jsonify(TUNE_PARAMS)


training_state = {"run_id": None, "status": "idle", "log": []}
training_lock = threading.Lock()


def _train_bg(run_id: str, params: dict = None):
    with training_lock:
        training_state["run_id"] = run_id
        training_state["status"] = "running"
        training_state["log"] = []

    def log(msg):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        with training_lock:
            training_state["log"].append(line)

    try:
        log("Fetching movement data...")
        movements = fetch_out_movements()
        log(f"  Got {len(movements)} out movements")

        log("Fetching spareparts & branches...")
        spareparts = fetch_spareparts()
        branches = fetch_branches()
        log(f"  Spareparts: {len(spareparts)}, Branches: {len(branches)}")

        if movements.empty:
            log("ERROR: No movement data found")
            with training_lock:
                training_state["status"] = "error"
            return

        log("Building features...")
        features = build_features(movements, spareparts)
        if features.empty:
            log("ERROR: Not enough data for feature engineering")
            with training_lock:
                training_state["status"] = "error"
            return
        log(f"  Features: {len(features)} rows, {len(features.columns)} cols")

        log("Training XGBoost model...")
        if params:
            log("  Custom params: " + ", ".join(f"{k}={v}" for k, v in params.items()))
        result = train_model(features, **(params or {}))
        result["n_spareparts"] = int(features["sparepart_id"].nunique())
        result["n_branches"] = int(features["branch_id"].nunique())
        result["n_samples"] = len(features)

        log(f"  R²: {result['metrics']['r2']}")
        log(f"  RMSE: {result['metrics']['rmse']}")
        log(f"  MAE: {result['metrics']['mae']}")
        log(f"  MAPE: {result['metrics']['mape']}%")
        log(f"  Residuals std: {result['metrics']['residuals_std']}")
        log(f"  Train: {result['n_train']} samples, Test: {result['n_test']} samples")
        log(f"  Spareparts: {result['n_spareparts']}, Branches: {result['n_branches']}")
        log("  Feature importance:")
        for fi in result["feature_importance"][:5]:
            log(f"    {fi['feature']}: {fi['importance']:.4f}")

        log("Training complete!")
        with training_lock:
            training_state["status"] = "completed"
    except Exception as e:
        log(f"ERROR: {str(e)}")
        with training_lock:
            training_state["status"] = "error"


@app.route("/api/train", methods=["POST"])
def train():
    async_mode = request.args.get("async", "").lower() in ("1", "true", "yes")
    if not async_mode:
        try:
            movements = fetch_out_movements()
            spareparts = fetch_spareparts()
            branches = fetch_branches()

            if movements.empty:
                return jsonify({"error": "No movement data found"}), 400

            features = build_features(movements, spareparts)
            if features.empty:
                return jsonify({"error": "Not enough data for feature engineering"}), 400

            result = train_model(features)
            result["n_spareparts"] = int(features["sparepart_id"].nunique())
            result["n_branches"] = int(features["branch_id"].nunique())
            result["n_samples"] = len(features)

            return jsonify({"success": True, "data": result})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    body = request.get_json(silent=True) or {}
    custom_params = body.get("params", None)

    run_id = str(uuid.uuid4())
    thread = threading.Thread(target=_train_bg, args=(run_id, custom_params), daemon=True)
    thread.start()
    return jsonify({"success": True, "run_id": run_id, "status": "started"})


@app.route("/api/train-status")
def get_train_status():
    run_id = request.args.get("run_id")
    with training_lock:
        if run_id and training_state["run_id"] != run_id:
            return jsonify({"status": "unknown"})
        return jsonify({
            "run_id": training_state["run_id"],
            "status": training_state["status"],
        })


@app.route("/api/train-log")
def get_train_log():
    run_id = request.args.get("run_id")
    since = int(request.args.get("since", 0))
    with training_lock:
        if run_id and training_state["run_id"] != run_id:
            return jsonify({"log": [], "more": False})
        log_slice = training_state["log"][since:]
        return jsonify({
            "log": log_slice,
            "total": len(training_state["log"]),
            "more": training_state["status"] == "running",
        })


# ================================
# AUTO-PREDICT SCHEDULER
# ================================

def _get_latest_movement_date():
    resp = supabase.table("stock_movements") \
        .select("created_at") \
        .eq("type", "out") \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    rows = resp.data or []
    if not rows:
        return None
    return rows[0]["created_at"]


def _load_last_predict_state():
    if os.path.exists(LAST_PREDICT_PATH):
        with open(LAST_PREDICT_PATH) as f:
            return json.load(f)
    return {"last_movement_date": None, "last_predict_at": None}


def _save_last_predict_state(state: dict):
    os.makedirs(os.path.dirname(LAST_PREDICT_PATH), exist_ok=True)
    with open(LAST_PREDICT_PATH, "w") as f:
        json.dump(state, f, indent=2)


def check_and_predict():
    with app.app_context():
        try:
            state = _load_last_predict_state()
            latest = _get_latest_movement_date()
            if latest is None:
                return

            last_mov = state.get("last_movement_date")
            if last_mov and latest <= last_mov:
                return

            model = load_model()
            if model is None:
                return

            if not os.path.exists(METRICS_PATH):
                return

            with open(METRICS_PATH) as f:
                metrics_data = json.load(f)
            rmse = metrics_data["metrics"]["rmse"]
            z = SERVICE_LEVEL_Z
            fetch_params = fetch_forecast_params()
            z = float(fetch_params.get("service_level_z", SERVICE_LEVEL_Z))
            holding_pct = float(fetch_params.get("holding_cost_pct", HOLDING_COST_PCT))

            movements = fetch_out_movements()
            spareparts = fetch_spareparts()
            branches = fetch_branches()
            stocks = fetch_branch_stocks()

            if movements.empty or spareparts.empty:
                return

            stock_map = {}
            if not stocks.empty:
                for _, r in stocks.iterrows():
                    stock_map[(r["sparepart_id"], r["branch_id"])] = int(r["quantity"])

            lead_time_map = {}
            price_map = {}
            for _, r in spareparts.iterrows():
                lead_time_map[r["id"]] = int(r.get("lead_time", 3))
                price_map[r["id"]] = float(r.get("price", 0))

            history = build_features(movements, spareparts)
            active_spareparts = spareparts["id"].tolist()
            active_branches = branches["id"].tolist()

            months = PREDICTION_MONTHS
            now = datetime.now()
            next_year = now.year + (now.month // 12)
            next_month = (now.month % 12) + 1
            period_start = f"{next_year}-{next_month:02d}-01"
            period_end = (datetime(next_year, next_month, 1) + timedelta(days=31 * months)).strftime("%Y-%m-%d")
            future_months = get_prediction_dates(period_start, period_end)[:months]

            series_insert = []
            dynamic_agg = {}
            run_id = str(uuid.uuid4())

            for sp_id in active_spareparts:
                for br_id in active_branches:
                    pf = build_prediction_features(sp_id, br_id, future_months, spareparts, history)
                    if pf.empty:
                        continue
                    preds = predict_future(pf, model)
                    lt = lead_time_map.get(sp_id, 3)
                    sp_price = price_map.get(sp_id, 0)

                    key = (sp_id, br_id)
                    dynamic_agg[key] = {"preds": []}

                    for i, row in pf.iterrows():
                        val = max(0, float(preds[i]))
                        confidence_lower = round(max(0, val - z * rmse), 2)
                        confidence_upper = round(val + z * rmse, 2)
                        safety_stock = round(z * rmse * math.sqrt(lt / 30), 2)
                        annual_demand = val * 12

                        demand_during_lt = val * (lt / 30)
                        rop = round(demand_during_lt + safety_stock, 2)

                        holding_cost = sp_price * holding_pct
                        if holding_cost > 0 and sp_price > 0 and annual_demand > 0:
                            eoq = round(math.sqrt(2 * annual_demand * sp_price / holding_cost), 2)
                        else:
                            eoq = 0

                        series_insert.append({
                            "forecast_run_id": run_id,
                            "sparepart_id": sp_id,
                            "branch_id": br_id,
                            "month": row["month"],
                            "predicted_quantity": round(val, 2),
                            "confidence_lower": confidence_lower,
                            "confidence_upper": confidence_upper,
                        })

                        dynamic_agg[key]["preds"].append({
                            "safety": safety_stock, "rop": rop, "eoq": eoq,
                        })

            if not series_insert:
                return

            old_runs = supabase.table("forecast_runs") \
                .select("id") \
                .eq("method", "xgboost") \
                .execute()
            old_ids = [r["id"] for r in (old_runs.data or [])]
            if old_ids:
                supabase.table("forecast_series") \
                    .delete() \
                    .in_("forecast_run_id", old_ids) \
                    .execute()

            supabase.table("forecast_runs").insert({
                "id": run_id,
                "method": "xgboost",
                "period_start": period_start,
                "period_end": period_end,
                "status": "completed",
            }).execute()

            BATCH = 100
            for i in range(0, len(series_insert), BATCH):
                supabase.table("forecast_series").insert(
                    series_insert[i:i + BATCH]
                ).execute()

            _save_dynamic_params(dynamic_agg)

            state["last_movement_date"] = latest
            state["last_predict_at"] = datetime.now().isoformat()
            _save_last_predict_state(state)

            print(f"[AUTO] Predict completed: {len(series_insert)} items (new movement: {latest})")

        except Exception as e:
            print(f"[AUTO] Predict error: {e}")


@app.route("/api/auto-status")
def get_auto_status():
    state = _load_last_predict_state()
    return jsonify(state)


def start_scheduler():
    sched = BackgroundScheduler(daemon=True)
    sched.add_job(check_and_predict, "interval", hours=1, id="auto_predict")
    sched.start()
    print("[SCHEDULER] Auto-predict every 1 hour")


def _save_dynamic_params(sparepart_agg: dict):
    for (sp_id, br_id), vals in sparepart_agg.items():
        if not vals["preds"]:
            continue
        avg_rop = round(sum(v["rop"] for v in vals["preds"]) / len(vals["preds"]))
        avg_eoq = round(sum(v["eoq"] for v in vals["preds"]) / len(vals["preds"]))
        safety = round(vals["preds"][0]["safety"])
        supabase.table("branch_stocks") \
            .update({
                "safety_stock": safety,
                "reorder_point": avg_rop,
                "eoq": avg_eoq,
                "max_stock": round(avg_rop + avg_eoq),
                "min_stock": avg_rop,
            }) \
            .eq("sparepart_id", sp_id) \
            .eq("branch_id", br_id) \
            .execute()


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        months = int(request.args.get("months", PREDICTION_MONTHS))
        horizon = request.args.get("horizon")
        if horizon:
            months = max(1, math.ceil(int(horizon) / 30))
        model = load_model()
        if model is None:
            return jsonify({"error": "Model not trained. Call /api/train first."}), 400

        if not os.path.exists(METRICS_PATH):
            return jsonify({"error": "Metrics not found. Call /api/train first."}), 400
        with open(METRICS_PATH) as f:
            metrics_data = json.load(f)
        rmse = metrics_data["metrics"]["rmse"]
        z = SERVICE_LEVEL_Z

        fetch_params = fetch_forecast_params()
        z = float(fetch_params.get("service_level_z", SERVICE_LEVEL_Z))
        holding_pct = float(fetch_params.get("holding_cost_pct", HOLDING_COST_PCT))

        movements = fetch_out_movements()
        spareparts = fetch_spareparts()
        branches = fetch_branches()
        stocks = fetch_branch_stocks()

        if movements.empty or spareparts.empty:
            return jsonify({"error": "No data found"}), 400

        stock_map = {}
        if not stocks.empty:
            for _, r in stocks.iterrows():
                stock_map[(r["sparepart_id"], r["branch_id"])] = int(r["quantity"])

        lead_time_map = {}
        price_map = {}
        for _, r in spareparts.iterrows():
            lead_time_map[r["id"]] = int(r.get("lead_time", 3))
            price_map[r["id"]] = float(r.get("price", 0))

        history = build_features(movements, spareparts)
        active_spareparts = spareparts["id"].tolist()
        active_branches = branches["id"].tolist()

        now = datetime.now()
        next_year = now.year + (now.month // 12)
        next_month = (now.month % 12) + 1
        period_start = f"{next_year}-{next_month:02d}-01"
        period_end = (datetime(next_year, next_month, 1) + timedelta(days=31 * months)).strftime("%Y-%m-%d")
        future_months = get_prediction_dates(period_start, period_end)[:months]

        series_insert = []
        enriched = []
        dynamic_agg = {}
        run_id = str(uuid.uuid4())

        for sp_id in active_spareparts:
            for br_id in active_branches:
                pf = build_prediction_features(sp_id, br_id, future_months, spareparts, history)
                if pf.empty:
                    continue
                preds = predict_future(pf, model)
                lt = lead_time_map.get(sp_id, 3)
                sp_price = price_map.get(sp_id, 0)
                current_stock = stock_map.get((sp_id, br_id), 0)
                sp_name = spareparts.loc[spareparts["id"] == sp_id, "name"].values[0] if not spareparts[spareparts["id"] == sp_id].empty else ""

                key = (sp_id, br_id)
                dynamic_agg[key] = {"preds": []}

                for i, row in pf.iterrows():
                    val = max(0, float(preds[i]))
                    annual_demand = val * 12
                    confidence_lower = round(max(0, val - z * rmse), 2)
                    confidence_upper = round(val + z * rmse, 2)
                    safety_stock = round(z * rmse * math.sqrt(lt / 30), 2)

                    demand_during_lt = val * (lt / 30)
                    rop = round(demand_during_lt + safety_stock, 2)

                    holding_cost = sp_price * holding_pct
                    if holding_cost > 0 and sp_price > 0 and annual_demand > 0:
                        eoq = round(math.sqrt(2 * annual_demand * sp_price / holding_cost), 2)
                    else:
                        eoq = 0

                    series_insert.append({
                        "forecast_run_id": run_id,
                        "sparepart_id": sp_id,
                        "branch_id": br_id,
                        "month": row["month"],
                        "predicted_quantity": round(val, 2),
                        "confidence_lower": confidence_lower,
                        "confidence_upper": confidence_upper,
                    })

                    enriched.append({
                        "sparepart_id": sp_id,
                        "branch_id": br_id,
                        "month": row["month"],
                        "sparepart_name": sp_name,
                        "current_stock": current_stock,
                        "predicted_quantity": round(val, 2),
                        "confidence_lower": confidence_lower,
                        "confidence_upper": confidence_upper,
                        "safety_stock": safety_stock,
                        "reorder_point": rop,
                        "eoq": eoq,
                        "max_stock": round(rop + eoq, 2),
                    })

                    dynamic_agg[key]["preds"].append({
                        "safety": safety_stock, "rop": rop, "eoq": eoq,
                    })

        if not series_insert:
            return jsonify({"error": "No predictions generated"}), 400

        # hapus series lama (forecast_runs tetap)
        old_runs = supabase.table("forecast_runs") \
            .select("id") \
            .eq("method", "xgboost") \
            .execute()
        old_ids = [r["id"] for r in (old_runs.data or [])]
        if old_ids:
            supabase.table("forecast_series") \
                .delete() \
                .in_("forecast_run_id", old_ids) \
                .execute()

        supabase.table("forecast_runs").insert({
            "id": run_id,
            "method": "xgboost",
            "period_start": period_start,
            "period_end": period_end,
            "status": "completed",
        }).execute()

        BATCH = 100
        for i in range(0, len(series_insert), BATCH):
            supabase.table("forecast_series").insert(
                series_insert[i:i + BATCH]
            ).execute()

        # Simpan rata-rata dinamis ke branch_stocks
        _save_dynamic_params(dynamic_agg)

        return jsonify({
            "success": True,
            "forecast_run_id": run_id,
            "total_predictions": len(series_insert),
            "period_start": period_start,
            "period_end": period_end,
            "rmse_used": rmse,
            "z_used": z,
            "output": enriched,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/dashboard")
def serve_dashboard():
    return send_from_directory(DASHBOARD_DIR, "index.html")


@app.route("/dashboard/<path:filename>")
def serve_dashboard_file(filename):
    return send_from_directory(DASHBOARD_DIR, filename)


@app.route("/")
def index():
    return """
    <h1>SpareTrack - Inventory ML</h1>
    <p><a href="/dashboard">Monitoring Dashboard</a></p>
    <ul>
      <li><a href="/api/health">/api/health</a></li>
      <li><a href="/api/metrics">/api/metrics</a></li>
      <li><a href="/api/feature-importance">/api/feature-importance</a></li>
      <li><a href="/api/predictions">/api/predictions</a></li>
      <li><a href="/api/output">/api/output (enriched)</a></li>
    </ul>
    """


if __name__ == "__main__":
    start_scheduler()
    app.run(host="0.0.0.0", port=5001, debug=True, use_reloader=False)
