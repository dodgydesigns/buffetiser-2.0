from fastapi import APIRouter
from app.api.v1.endpoints import users

api_router = APIRouter()
api_router.include_router(users.router)


@api_router.get("/health")
def health():
	return {"status": "ok"}
