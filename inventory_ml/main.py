#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import argparse
from datetime import datetime, timedelta

from config import PREDICTION_MONTHS
from models.data import fetch_out_movements, fetch_spareparts, build_features
from models.xgboost import train_model, load_model, predict_future


def cmd_train():
    print("=== Training XGBoost Model ===")
    movements = fetch_out_movements()
    spareparts = fetch_spareparts()
    print(f"  Movements (out): {len(movements)}")
    print(f"  Spareparts active: {len(spareparts)}")

    features = build_features(movements, spareparts)
    print(f"  Features engineered: {len(features)} rows")

    if features.empty:
        print("  ERROR: No features to train on")
        return

    result = train_model(features)
    print(f"  Training complete!")
    print(f"    Train samples: {result['n_train']}")
    print(f"    Test samples:  {result['n_test']}")
    print(f"    MAE:  {result['metrics']['mae']}")
    print(f"    RMSE: {result['metrics']['rmse']}")
    print(f"    R²:   {result['metrics']['r2']}")
    print(f"    MAPE: {result['metrics']['mape']}%")


def cmd_predict(args):
    print("=== Generate Predictions ===")
    model = load_model()
    if model is None:
        print("  ERROR: Model not trained. Run 'train' first.")
        return

    months = args.months or PREDICTION_MONTHS
    print(f"  Predicting next {months} months...")

    from api import app
    with app.test_client() as client:
        resp = client.post(f"/api/predict?months={months}")
        data = resp.get_json()
        if data.get("success"):
            print(f"  Predictions saved to Supabase!")
            print(f"    Run ID:     {data['forecast_run_id']}")
            print(f"    Total:      {data['total_predictions']} predictions")
            print(f"    Period:     {data['period_start']} -> {data['period_end']}")
        else:
            print(f"  ERROR: {data.get('error', 'Unknown')}")


def cmd_run(args):
    cmd_train()
    print()
    cmd_predict(args)


def cmd_serve(args):
    port = args.port or 5001
    print(f"Starting Flask server on port {port}...")
    print(f"Dashboard: http://localhost:{port}/dashboard")
    print(f"Auto-predict scheduler: every 1 hour")
    from api import app, start_scheduler
    start_scheduler()
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)


def main():
    parser = argparse.ArgumentParser(description="SpareTrack XGBoost Inventory ML")
    sub = parser.add_subparsers(dest="command", required=True)

    p_train = sub.add_parser("train", help="Train XGBoost model from Supabase data")
    p_predict = sub.add_parser("predict", help="Generate predictions")
    p_predict.add_argument("--months", type=int, default=None, help="Number of months to predict")
    p_run = sub.add_parser("run", help="Train + predict")
    p_run.add_argument("--months", type=int, default=None, help="Number of months to predict")
    p_serve = sub.add_parser("serve", help="Start Flask API + dashboard")
    p_serve.add_argument("--port", type=int, default=5001, help="Port to listen on")

    args = parser.parse_args()

    if args.command == "train":
        cmd_train()
    elif args.command == "predict":
        cmd_predict(args)
    elif args.command == "run":
        cmd_run(args)
    elif args.command == "serve":
        cmd_serve(args)


if __name__ == "__main__":
    main()
