import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

MODEL_DIR: str = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH: str = os.path.join(MODEL_DIR, "xgboost_model.json")
METRICS_PATH: str = os.path.join(MODEL_DIR, "metrics.json")

PREDICTION_MONTHS: int = 3

SERVICE_LEVEL_Z: float = 1.96
HOLDING_COST_PCT: float = 0.15
