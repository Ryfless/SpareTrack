import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd
import pytest
from unittest.mock import MagicMock, patch


class TestHealth:
    def test_health(self, flask_client):
        resp = flask_client.get("/api/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "ok"
        assert data["service"] == "inventory-ml-xgboost"


class TestMetrics:
    def test_metrics_no_model(self, flask_client, mock_model_paths):
        resp = flask_client.get("/api/metrics")
        assert resp.status_code == 400

    def test_metrics_with_model(self, flask_client, seed_metrics):
        resp = flask_client.get("/api/metrics")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["metrics"]["rmse"] == 2.0
        assert data["metrics"]["r2"] == 0.85


class TestModelStats:
    def test_model_stats_no_model(self, flask_client):
        resp = flask_client.get("/api/model-stats")
        assert resp.status_code == 400

    def test_model_stats_with_model(self, flask_client, mock_model_paths):
        model_data = {"learner": {"attributes": {"best_iteration": "10", "best_score": "0.9"}, "feature_names": ["f1", "f2"], "gradient_booster": {"model": {"gbtree_model_param": {"num_trees": "10"}}}}}
        with open(mock_model_paths["model"], "w") as f:
            json.dump(model_data, f)
        resp = flask_client.get("/api/model-stats")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["best_iteration"] == 10
        assert data["num_trees"] == 10


class TestFeatureImportance:
    def test_feature_importance_no_model(self, flask_client, mock_model_paths):
        resp = flask_client.get("/api/feature-importance")
        assert resp.status_code == 400

    def test_feature_importance_with_data(self, flask_client, seed_metrics):
        resp = flask_client.get("/api/feature-importance")
        assert resp.status_code == 200


class TestPredictions:
    def test_get_predictions_empty(self, flask_client, mock_supabase):
        resp = flask_client.get("/api/predictions")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_get_predictions_with_data(self, flask_client, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[{"id": "run1"}])
        mock_supabase.table.return_value.select.return_value.in_.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[
            {"id": "p1", "month": "2026-04-01", "predicted_quantity": 15.0, "confidence_lower": 10.0, "confidence_upper": 20.0, "spareparts": {"name": "Brake", "code": "BRK"}, "branches": {"name": "Jakarta"}},
        ])
        resp = flask_client.get("/api/predictions")
        assert resp.status_code == 200
        data = resp.get_json()
        assert len(data) == 1
        assert data[0]["sparepart_name"] == "Brake"


class TestOutput:
    def test_get_output(self, flask_client, mock_supabase, mock_model_paths):
        with patch("api.fetch_spareparts") as m_fetch_sp:
            m_fetch_sp.return_value = pd.DataFrame({"id": ["sp1"], "name": ["Brake"], "code": ["BRK"], "price": [50000], "lead_time": [3], "category_id": ["cat1"], "is_active": [True]})
            with patch("api.fetch_branches") as m_fetch_br:
                m_fetch_br.return_value = pd.DataFrame({"id": ["br1"], "name": ["Jakarta"], "code": ["JKT"], "city": ["Jakarta"]})
                with patch("api.fetch_branch_stocks") as m_fetch_bs:
                    m_fetch_bs.return_value = pd.DataFrame({"sparepart_id": ["sp1"], "branch_id": ["br1"], "quantity": [10], "safety_stock": [2], "reorder_point": [5], "eoq": [0], "max_stock": [20], "min_stock": [5]})
                    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[{"id": "run1"}])
                    mock_supabase.table.return_value.select.return_value.in_.return_value.order.return_value.execute.return_value = MagicMock(data=[
                        {"id": "p1", "sparepart_id": "sp1", "branch_id": "br1", "month": "2026-04-01", "predicted_quantity": 15.0, "confidence_lower": 10.0, "confidence_upper": 20.0},
                    ])
                    resp = flask_client.get("/api/output")
                    assert resp.status_code == 200
                    data = resp.get_json()
                    assert len(data) >= 1


class TestComputeStatus:
    def test_compute_status_kritis(self):
        from api import _compute_status
        assert _compute_status(3, 5, 20, 2) == "Kritis"

    def test_compute_status_menipis(self):
        from api import _compute_status
        assert _compute_status(6, 5, 20, 2) == "Menipis"

    def test_compute_status_overstock(self):
        from api import _compute_status
        assert _compute_status(25, 5, 20, 2) == "Overstock"

    def test_compute_status_aman(self):
        from api import _compute_status
        assert _compute_status(15, 5, 20, 2) == "Aman"


class TestListSpareparts:
    def test_list_spareparts(self, flask_client):
        with patch("api.fetch_spareparts") as m:
            m.return_value = pd.DataFrame({"id": ["sp1"], "name": ["Brake"]})
            resp = flask_client.get("/api/spareparts")
            assert resp.status_code == 200
            data = resp.get_json()
            assert data[0]["name"] == "Brake"

    def test_list_branches(self, flask_client):
        with patch("api.fetch_branches") as m:
            m.return_value = pd.DataFrame({"id": ["br1"], "name": ["Jakarta"]})
            resp = flask_client.get("/api/branches")
            assert resp.status_code == 200
            data = resp.get_json()
            assert data[0]["name"] == "Jakarta"


class TestTrain:
    def test_train_async(self, flask_client):
        with patch("api.train_model") as m_train:
            m_train.return_value = {"metrics": {"mae": 1.0}}
            with patch("api.fetch_out_movements") as m_mov:
                m_mov.return_value = pd.DataFrame({"sparepart_id": ["sp1"], "branch_id": ["br1"], "quantity": [5], "created_at": pd.to_datetime(["2026-01-01"]), "month": ["2026-01"]})
                with patch("api.fetch_spareparts") as m_sp:
                    m_sp.return_value = pd.DataFrame({"id": ["sp1"], "name": ["Brake"], "price": [50000], "lead_time": [3], "category_id": ["cat1"], "is_active": [True]})
                    with patch("api.fetch_branches") as m_br:
                        m_br.return_value = pd.DataFrame({"id": ["br1"], "name": ["Jkt"]})
                        with patch("api.build_features") as m_bf:
                            m_bf.return_value = pd.DataFrame({"sparepart_id": ["sp1"], "branch_id": ["br1"], "demand": [5], "lag_1": [0], "lag_2": [0], "lag_3": [0], "rolling_mean_3": [5], "month_sin": [0.5], "month_cos": [0.87], "quarter": [1], "price": [50000], "sparepart_encoded": [5], "branch_encoded": [5], "month_dt": pd.to_datetime(["2026-01-01"])})
                            resp = flask_client.post("/api/train?async=true")
                            assert resp.status_code == 200
                            data = resp.get_json()
                            assert data["success"]
                            assert data["status"] == "started"

    def test_train_no_data(self, flask_client):
        with patch("api.fetch_out_movements") as m:
            m.return_value = pd.DataFrame()
            resp = flask_client.post("/api/train")
            assert resp.status_code == 400


class TestPredict:
    def test_predict_no_model(self, flask_client):
        from config import MODEL_PATH
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)
        resp = flask_client.post("/api/predict")
        assert resp.status_code == 400
        data = resp.get_json()
        assert "error" in data
