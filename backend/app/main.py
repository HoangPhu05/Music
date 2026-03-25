from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, playlists, songs


def _parse_cors_origins() -> list[str]:
    return [origin.strip() for origin in settings.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]


app = FastAPI(
    title="Music App API",
    description="API for storing, streaming and downloading music.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(songs.router)
app.include_router(playlists.router)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Music App API is running"}
