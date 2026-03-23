from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings
from app.core.database import engine
from app.models import user
from app.api.routes.auth import router as auth_router
from app.api.routes.jobs import router as jobs_router

user.Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name)

app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(auth_router, prefix=settings.api_v1_prefix + "/auth")
app.include_router(jobs_router, prefix=settings.api_v1_prefix)


@app.get("/")
def read_root():
    return {
        "message": f"{settings.app_name} is running",
        "environment": settings.app_env
    }