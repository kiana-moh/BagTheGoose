from pydantic import BaseModel


class JobCreate(BaseModel):
    title: str
    company: str
    location: str | None = None
    description: str | None = None
    url: str | None = None