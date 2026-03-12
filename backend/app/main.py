from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.include_router(health_router, prefix=settings.api_v1_prefix)


@app.get("/")
def read_root():
    return {
        "message": f"{settings.app_name} is running",
        "environment": settings.app_env
    }