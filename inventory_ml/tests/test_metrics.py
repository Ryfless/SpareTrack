import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
from models.metrics import mean_absolute_error, root_mean_squared_error, r2_score, mape, residual_std, compute_all


def test_mae():
    y_true = [1, 2, 3, 4]
    y_pred = [1, 2, 3, 4]
    assert mean_absolute_error(y_true, y_pred) == 0.0

    y_pred = [2, 3, 4, 5]
    assert mean_absolute_error(y_true, y_pred) == 1.0


def test_rmse():
    y_true = [0, 0, 0]
    y_pred = [1, 2, 3]
    expected = np.sqrt((1 + 4 + 9) / 3)
    assert root_mean_squared_error(y_true, y_pred) == pytest.approx(expected)


def test_r2_perfect():
    y_true = [1, 2, 3, 4, 5]
    y_pred = [1, 2, 3, 4, 5]
    assert r2_score(y_true, y_pred) == 1.0


def test_r2_constant():
    y_true = [5, 5, 5]
    y_pred = [5, 5, 5]
    assert r2_score(y_true, y_pred) == 1.0


def test_r2_bad():
    y_true = [1, 2, 3]
    y_pred = [10, 10, 10]
    assert r2_score(y_true, y_pred) < 0


def test_mape():
    y_true = [100, 200, 300]
    y_pred = [110, 200, 270]
    result = mape(y_true, y_pred)
    expected = (abs((100-110)/100) + abs((200-200)/200) + abs((300-270)/300)) / 3 * 100
    assert result == pytest.approx(expected)


def test_mape_zero_true():
    assert mape([0, 0], [1, 2]) == 0.0


def test_residual_std():
    y_true = [1, 2, 3]
    y_pred = [1, 2, 3]
    assert residual_std(y_true, y_pred) == 0.0

    y_true = [1, 2, 3]
    y_pred = [2, 3, 4]
    std = float(np.std([-1, -1, -1], ddof=1))
    assert residual_std(y_true, y_pred) == std


def test_compute_all():
    y_true = [1, 2, 3, 4, 5]
    y_pred = [1.1, 2.2, 2.9, 4.1, 4.8]
    result = compute_all(y_true, y_pred)
    assert "mae" in result
    assert "rmse" in result
    assert "r2" in result
    assert "mape" in result
    assert "residuals_std" in result
    assert isinstance(result["r2"], float)
    assert result["mae"] >= 0


import pytest
