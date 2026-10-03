from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import pandas as pd

from account_takeover.account_takeover_service import analyze_account_takeover


app = FastAPI(title="CyberGuard Account Takeover API")


class AccountTakeoverRequest(BaseModel):
    events: List[Dict[str, Any]] = Field(default_factory=list)
    profiles: Optional[List[Dict[str, Any]]] = None


def clean_value(value):
    """Convert pandas/numpy values into JSON-safe Python values."""
    if value is None:
        return None

    if isinstance(value, dict):
        return {str(k): clean_value(v) for k, v in value.items()}

    if isinstance(value, list):
        return [clean_value(v) for v in value]

    if isinstance(value, tuple):
        return [clean_value(v) for v in value]

    if isinstance(value, pd.Timestamp):
        return value.isoformat()

    try:
        if pd.isna(value):
            return None
    except Exception:
        pass

    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass

    return value


@app.get("/")
def health():
    return {
        "success": True,
        "service": "CyberGuard Account Takeover Detection",
        "status": "online",
        "detectors": 6
    }


@app.post("/")
def analyze(request: AccountTakeoverRequest):
    if not request.events:
        raise HTTPException(
            status_code=400,
            detail="At least one event is required."
        )

    try:
        events_df = pd.DataFrame(request.events)

        profiles_df = None
        if request.profiles is not None:
            profiles_df = pd.DataFrame(request.profiles)

        result = analyze_account_takeover(
            events=events_df,
            profiles=profiles_df
        )

        return {
            "success": True,
            "type": "account_takeover",
            "result": clean_value(result)
        }

    except (ValueError, TypeError) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print("CyberGuard Account Takeover API error:", repr(error))
        raise HTTPException(
            status_code=500,
            detail="Account takeover analysis failed."
        )
