from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.schemas.job import JobCreate
from app.models.job import Job

router = APIRouter()


@router.post("/jobs")
def create_job(job: JobCreate, db: Session = Depends(get_db)):

    new_job = Job(
        title=job.title,
        company=job.company,
        location=job.location,
        description=job.description,
        url=job.url
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job