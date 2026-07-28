import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd
import pytest
from unittest.mock import MagicMock
from models.data import (
    fetch_out_movements, fetch_spareparts, fetch_branches,
    fetch_branch_stocks, fetch_forecast_params,
    build_features, get_prediction_dates, build_prediction_features,
)


def build_mock_chain(data):
    mock = MagicMock()
    mock.execute.return_value = MagicMock(data=data)
    return mock


class TestFetchFunctions:
    def test_fetch_out_movements_empty(self, mock_supabase):
        df = fetch_out_movements()
        assert df.empty

    def test_fetch_out_movements_with_data(self, mock_supabase):
        rows = [
            {"sparepart_id": "sp1", "branch_id": "br1", "quantity": -5, "created_at": "2026-01-15T00:00:00Z"},
            {"sparepart_id": "sp1", "branch_id": "br1", "quantity": -3, "created_at": "2026-02-10T00:00:00Z"},
        ]
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=rows)
        df = fetch_out_movements()
        assert not df.empty
        assert len(df) == 2
        assert "month" in df.columns
        assert df["quantity"].iloc[0] == 5

    def test_fetch_spareparts(self, mock_supabase):
        rows = [{"id": "sp1", "name": "Brake Pad", "code": "BRK", "price": 50000, "lead_time": 3, "category_id": "cat1", "is_active": True}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=rows)
        df = fetch_spareparts()
        assert not df.empty
        assert df["name"].iloc[0] == "Brake Pad"

    def test_fetch_spareparts_empty(self, mock_supabase):
        df = fetch_spareparts()
        assert df.empty

    def test_fetch_branches(self, mock_supabase):
        rows = [{"id": "br1", "name": "Jakarta", "code": "JKT", "city": "Jakarta"}]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=rows)
        df = fetch_branches()
        assert not df.empty
        assert df["name"].iloc[0] == "Jakarta"

    def test_fetch_branch_stocks(self, mock_supabase):
        rows = [{"sparepart_id": "sp1", "branch_id": "br1", "quantity": 10, "safety_stock": 2, "reorder_point": 5, "eoq": 0, "max_stock": 20, "min_stock": 5}]
        mock_supabase.table.return_value.select.return_value.execute.return_value = MagicMock(data=rows)
        df = fetch_branch_stocks()
        assert not df.empty
        assert df["quantity"].iloc[0] == 10

    def test_fetch_forecast_params(self, mock_supabase):
        rows = [{"key": "service_level_z", "value": "1.96"}, {"key": "holding_cost_pct", "value": "0.15"}]
        mock_supabase.table.return_value.select.return_value.is_.return_value.in_.return_value.execute.return_value = MagicMock(data=rows)
        params = fetch_forecast_params()
        assert params["service_level_z"] == 1.96
        assert params["holding_cost_pct"] == 0.15

    def test_fetch_forecast_params_empty(self, mock_supabase):
        params = fetch_forecast_params()
        assert params == {}


class TestBuildFeatures:
    def test_build_features_basic(self):
        movements = pd.DataFrame({
            "sparepart_id": ["sp1", "sp1"],
            "branch_id": ["br1", "br1"],
            "quantity": [10, 20],
            "created_at": pd.to_datetime(["2026-01-15", "2026-02-10"], utc=True),
            "month": ["2026-01", "2026-02"],
        })
        spareparts = pd.DataFrame({"id": ["sp1"], "name": ["Brake"], "price": [50000], "lead_time": [3], "category_id": ["cat1"], "is_active": [True]})
        df = build_features(movements, spareparts)
        assert not df.empty
        assert "lag_1" in df.columns
        assert "lag_2" in df.columns
        assert "lag_3" in df.columns
        assert "rolling_mean_3" in df.columns
        assert "month_sin" in df.columns
        assert "month_cos" in df.columns
        assert "price" in df.columns
        assert df["price"].iloc[0] == 50000

    def test_build_features_empty(self):
        movements = pd.DataFrame()
        spareparts = pd.DataFrame()
        df = build_features(movements, spareparts)
        assert df.empty


class TestGetPredictionDates:
    def test_get_prediction_dates(self):
        dates = get_prediction_dates("2026-01-01", "2026-03-31")
        assert len(dates) == 3
        assert dates[0] == "2026-01-01"
        assert dates[1] == "2026-02-01"
        assert dates[2] == "2026-03-01"

    def test_get_prediction_dates_single(self):
        dates = get_prediction_dates("2026-06-01", "2026-06-15")
        assert len(dates) == 1
        assert dates[0] == "2026-06-01"


class TestBuildPredictionFeatures:
    def test_build_prediction_features_basic(self):
        spareparts = pd.DataFrame({"id": ["sp1"], "name": ["Brake"], "price": [50000], "lead_time": [3], "category_id": ["cat1"], "is_active": [True]})
        history = pd.DataFrame({
            "sparepart_id": ["sp1", "sp1", "sp1"],
            "branch_id": ["br1", "br1", "br1"],
            "demand": [10, 15, 20],
            "month": ["2026-01", "2026-02", "2026-03"],
            "month_dt": pd.to_datetime(["2026-01-01", "2026-02-01", "2026-03-01"]),
            "lag_1": [0, 10, 15],
            "lag_2": [0, 0, 10],
            "lag_3": [0, 0, 0],
            "rolling_mean_3": [10, 12.5, 15],
            "month_num": [1, 2, 3],
            "month_sin": [0.5, 0.87, 1.0],
            "month_cos": [0.87, 0.5, 0.0],
            "quarter": [1, 1, 1],
            "price": [50000, 50000, 50000],
            "sparepart_encoded": [15, 15, 15],
            "branch_encoded": [15, 15, 15],
        })
        future = ["2026-04-01"]
        df = build_prediction_features("sp1", "br1", future, spareparts, history)
        assert not df.empty
        assert "lag_1" in df.columns
        assert df["lag_1"].iloc[0] == 20
        assert df["price"].iloc[0] == 50000

    def test_build_prediction_features_no_history(self):
        spareparts = pd.DataFrame({"id": ["sp1"], "name": ["Brake"], "price": [50000], "lead_time": [3], "category_id": ["cat1"], "is_active": [True]})
        history = pd.DataFrame()
        df = build_prediction_features("sp1", "br1", ["2026-04-01"], spareparts, history)
        assert df.empty
