"""
run.py
─────────────────────────────────────────────────────────────────────────────
Development / production entry point.

Usage:
    python run.py

Or directly with uvicorn:
    uvicorn app.main:app --host 0.0.0.0 --port 8000
"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
