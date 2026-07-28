import os
import sys

os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-key"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import json
import pytest
from unittest.mock import MagicMock, patch


def _build_supabase_mock():
    supabase = MagicMock()

    def chain_builder(data=None):
        m = MagicMock()
        m.execute.return_value = MagicMock(data=data or [])
        return m

    supabase.table.return_value = MagicMock()
    tbl = supabase.table.return_value
    tbl.select.return_value = MagicMock()
    sel = tbl.select.return_value
    sel.eq.return_value = MagicMock()
    sel_eq = sel.eq.return_value
    sel_eq.order.return_value = MagicMock()
    sel_eq_order = sel_eq.order.return_value
    sel_eq_order.limit.return_value = chain_builder()
    sel_eq.execute.return_value = MagicMock(data=[])
    sel.is_.return_value = MagicMock()
    sel.is_.return_value.in_.return_value = chain_builder()
    sel.in_.return_value = MagicMock()
    sel_in = sel.in_.return_value
    sel_in.order.return_value = MagicMock()
    sel_in_order = sel_in.order.return_value
    sel_in_order.limit.return_value = chain_builder()
    sel_in_order.execute.return_value = MagicMock(data=[])
    sel_in.gte.return_value = MagicMock()
    sel_in.gte.return_value.lte.return_value = chain_builder()
    sel_in.execute.return_value = MagicMock(data=[])
    sel_eq_order.execute.return_value = MagicMock(data=[])
    tbl.insert.return_value = chain_builder()
    tbl.update.return_value = MagicMock()
    tbl.update.return_value.eq.return_value = MagicMock()
    tbl.update.return_value.eq.return_value.eq.return_value = chain_builder()
    tbl.delete.return_value = MagicMock()
    tbl.delete.return_value.in_.return_value = chain_builder()

    return supabase


@pytest.fixture(autouse=True)
def mock_supabase():
    mock_obj = _build_supabase_mock()
    with patch("config.supabase", mock_obj):
        import models.data
        import api
        import models.xgboost
        models.data.supabase = __import__("config").supabase
        api.supabase = __import__("config").supabase
        yield mock_obj


@pytest.fixture
def tmp_model_dir(tmp_path):
    model_dir = tmp_path / "models"
    model_dir.mkdir()
    return model_dir


@pytest.fixture
def mock_model_paths(tmp_model_dir, monkeypatch):
    model_path = tmp_model_dir / "xgboost_model.json"
    metrics_path = tmp_model_dir / "metrics.json"
    last_predict_path = tmp_model_dir / "last_predict.json"

    import config
    monkeypatch.setattr(config, "MODEL_PATH", str(model_path))
    monkeypatch.setattr(config, "METRICS_PATH", str(metrics_path))
    monkeypatch.setattr(config, "LAST_PREDICT_PATH", str(last_predict_path))

    import api
    monkeypatch.setattr(api, "MODEL_PATH", str(model_path))
    monkeypatch.setattr(api, "METRICS_PATH", str(metrics_path))
    monkeypatch.setattr(api, "LAST_PREDICT_PATH", str(last_predict_path))

    import models.xgboost
    monkeypatch.setattr(models.xgboost, "MODEL_PATH", str(model_path))
    monkeypatch.setattr(models.xgboost, "METRICS_PATH", str(metrics_path))

    return {"model": str(model_path), "metrics": str(metrics_path), "last_predict": str(last_predict_path)}


@pytest.fixture
def seed_metrics(mock_model_paths):
    data = {"metrics": {"mae": 1.5, "rmse": 2.0, "r2": 0.85, "mape": 10.0, "residuals_std": 1.8}, "feature_importance": [{"feature": "lag_1", "importance": 0.5}], "n_train": 80, "n_test": 20, "training_date": "2026-01-01"}
    with open(mock_model_paths["metrics"], "w") as f:
        json.dump(data, f)
    return data


@pytest.fixture
def flask_client():
    with patch.dict(os.environ, {"SUPABASE_URL": "https://test.supabase.co", "SUPABASE_SERVICE_ROLE_KEY": "test-key"}):
        from api import app
        app.config["TESTING"] = True
        with app.test_client() as client:
            yield client
