import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SongResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    artist: str | None
    album: str | None
    duration_seconds: int | None
    file_format: str
    file_size_bytes: int | None
    created_at: datetime


class SongListResponse(BaseModel):
    total: int
    items: list[SongResponse]


class SongUpdateRequest(BaseModel):
    title: str | None = None
    artist: str | None = None
    album: str | None = None
