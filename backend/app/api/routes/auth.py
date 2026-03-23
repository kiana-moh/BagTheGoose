from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.core.deps import get_db
from app.schemas.auth import GoogleAuthRequest
from app.models.user import User

router = APIRouter()


@router.post("/google")
def google_login(data: GoogleAuthRequest, db: Session = Depends(get_db)):

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            settings.google_client_id
        )

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    email = idinfo["email"]
    name = idinfo.get("name")
    google_id = idinfo["sub"]

    user = db.query(User).filter(User.google_id == google_id).first()

    if not user:
        user = User(
            email=email,
            name=name,
            google_id=google_id
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "user_id": user.id,
        "email": user.email,
        "name": user.name
    }