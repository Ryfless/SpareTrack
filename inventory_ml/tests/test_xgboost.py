import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import json
import numpy as np
import pandas as pd
import pytest
from unittest.mock import patch, MagicMock


class TestTrainModel:
    def test_train_model_saves_files(self, mock_model_paths):
        with patch("models.xgboost.xgb.XGBRegressor") as MockModel:
            mock_instance = MagicMock()
            n_test = 2
            mock_instance.predict.return_value = np.array([5.0, 6.0])
            mock_instance.feature_importances_ = np.array([0.3, 0.2, 0.1, 0.1, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05])
            def fake_save_model(path):
                with open(path, "w") as f:
                    json.dump({"dummy": True}, f)
                with open(mock_model_paths["metrics"], "w") as f:
                    json.dump({"metrics": {"mae": 1.0}}, f)
            mock_instance.save_model.side_effect = fake_save_model
            MockModel.return_value = mock_instance

            features = pd.DataFrame({
                "lag_1": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                "lag_2": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                "lag_3": [0, 0, 1, 2, 3, 4, 5, 6, 7, 8],
                "rolling_mean_3": [1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9],
                "month_sin": [0.5] * 10,
                "month_cos": [0.87] * 10,
                "quarter": [1] * 10,
                "price": [50000] * 10,
                "sparepart_encoded": [15] * 10,
                "branch_encoded": [15] * 10,
                "demand": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                "month_dt": pd.date_range("2026-01-01", periods=10, freq="MS"),
                "sparepart_id": ["sp1"] * 10,
                "branch_id": ["br1"] * 10,
            })

            from models.xgboost import train_model
            result = train_model(features)

            assert os.path.exists(mock_model_paths["model"])
            assert os.path.exists(mock_model_paths["metrics"])
            assert "metrics" in result
            assert "feature_importance" in result
            assert result["n_train"] > 0
            assert result["n_test"] > 0

    def test_train_model_fallback_split_small(self, mock_model_paths):
        with patch("models.xgboost.xgb.XGBRegressor") as MockModel:
            mock_instance = MagicMock()
            mock_instance.predict.return_value = np.array([5.0])
            mock_instance.feature_importances_ = np.array([0.1] * 10)
            MockModel.return_value = mock_instance

            features = pd.DataFrame({
                "lag_1": [1],
                "lag_2": [0],
                "lag_3": [0],
                "rolling_mean_3": [1],
                "month_sin": [0.5],
                "month_cos": [0.87],
                "quarter": [1],
                "price": [50000],
                "sparepart_encoded": [15],
                "branch_encoded": [15],
                "demand": [5],
                "month_dt": pd.to_datetime(["2026-01-01"]),
                "sparepart_id": ["sp1"],
                "branch_id": ["br1"],
            })

            from models.xgboost import train_model
            result = train_model(features)
            assert result["n_train"] >= 1


class TestLoadModel:
    def test_load_model_not_found(self):
        from models.xgboost import load_model
        with patch("models.xgboost.os.path.exists", return_value=False):
            assert load_model() is None

    def test_load_model_found(self, mock_model_paths):
        with patch("models.xgboost.xgb.XGBRegressor") as MockModel:
            mock_instance = MagicMock()
            MockModel.return_value = mock_instance

            with open(mock_model_paths["model"], "w") as f:
                json.dump({"dummy": True}, f)

            from models.xgboost import load_model
            model = load_model()
            assert model is not None
            mock_instance.load_model.assert_called_once_with(mock_model_paths["model"])


class TestPredictFuture:
    def test_predict_future(self):
        from models.xgboost import predict_future
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([10.0, 20.0])

        features = pd.DataFrame({
            "lag_1": [1, 2],
            "lag_2": [0, 1],
            "lag_3": [0, 0],
            "rolling_mean_3": [1, 1.5],
            "month_sin": [0.5, 0.87],
            "month_cos": [0.87, 0.5],
            "quarter": [1, 1],
            "price": [50000, 50000],
            "sparepart_encoded": [15, 15],
            "branch_encoded": [15, 15],
        })

        result = predict_future(features, mock_model)
        assert len(result) == 2
        np.testing.assert_array_equal(result, np.array([10.0, 20.0]))
