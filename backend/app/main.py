from fastapi import FastAPI
from app.api.v1.api import api_router

app = FastAPI(title="Buffetiser API")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "ok"}
