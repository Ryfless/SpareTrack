import numpy as np


def mean_absolute_error(y_true, y_pred):
    return float(np.mean(np.abs(np.array(y_true) - np.array(y_pred))))


def root_mean_squared_error(y_true, y_pred):
    return float(np.sqrt(np.mean((np.array(y_true) - np.array(y_pred)) ** 2)))


def r2_score(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    if ss_tot == 0:
        return 1.0
    return float(1 - ss_res / ss_tot)


def mape(y_true, y_pred):
    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    mask = y_true != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def residual_std(y_true, y_pred):
    residuals = np.array(y_true) - np.array(y_pred)
    return float(np.std(residuals, ddof=1))


def compute_all(y_true, y_pred):
    return {
        "mae": round(mean_absolute_error(y_true, y_pred), 2),
        "rmse": round(root_mean_squared_error(y_true, y_pred), 2),
        "r2": round(r2_score(y_true, y_pred), 4),
        "mape": round(mape(y_true, y_pred), 2),
        "residuals_std": round(residual_std(y_true, y_pred), 2),
    }
