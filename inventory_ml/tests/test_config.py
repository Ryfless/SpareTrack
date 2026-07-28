import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_constants_exist():
    from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, MODEL_DIR, MODEL_PATH, METRICS_PATH, LAST_PREDICT_PATH, PREDICTION_MONTHS, SERVICE_LEVEL_Z, HOLDING_COST_PCT
    assert PREDICTION_MONTHS == 3
    assert SERVICE_LEVEL_Z == 1.96
    assert HOLDING_COST_PCT == 0.15


def test_model_dir_is_absolute():
    from config import MODEL_DIR
    assert os.path.isabs(MODEL_DIR) or MODEL_DIR.startswith(os.path.dirname(__file__).rsplit("\\", 1)[0])
    assert "models" in MODEL_DIR


import os
