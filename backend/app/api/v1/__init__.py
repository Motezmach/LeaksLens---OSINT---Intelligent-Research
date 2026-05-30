"""API v1 routers."""
from fastapi import APIRouter

from app.api.v1 import auth, history, search

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(history.router, prefix="/history", tags=["history"])
