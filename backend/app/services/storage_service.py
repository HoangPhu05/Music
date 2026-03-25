import uuid
from abc import ABC, abstractmethod
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.config import settings

ALLOWED_FORMATS = {"mp3", "wav", "flac"}
CLOUDINARY_PREFIX = "cloudinary://"


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lstrip(".").lower()


class StorageBackend(ABC):
    @abstractmethod
    async def save(self, file: UploadFile, owner_id: str) -> tuple[str, int]:
        ...

    @abstractmethod
    def delete(self, file_path: str) -> None:
        ...

    @abstractmethod
    def get_absolute_path(self, file_path: str) -> str:
        ...

    @abstractmethod
    def get_public_url(self, file_path: str) -> str | None:
        ...


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, file: UploadFile, owner_id: str) -> tuple[str, int]:
        ext = get_file_extension(file.filename or "")
        if ext not in ALLOWED_FORMATS:
            raise ValueError(f"Unsupported file extension: .{ext}")

        user_dir = self.base_path / owner_id
        user_dir.mkdir(parents=True, exist_ok=True)

        unique_name = f"{uuid.uuid4()}.{ext}"
        dest = user_dir / unique_name
        relative_path = f"{owner_id}/{unique_name}"

        size = 0
        async with aiofiles.open(dest, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)
                size += len(chunk)

        return relative_path, size

    def delete(self, file_path: str) -> None:
        full_path = self.base_path / file_path
        if full_path.exists():
            full_path.unlink()

    def get_absolute_path(self, file_path: str) -> str:
        return str(self.base_path / file_path)

    def get_public_url(self, file_path: str) -> str | None:
        return None


class CloudinaryStorageBackend(StorageBackend):
    def __init__(self, cloud_name: str, api_key: str, api_secret: str, folder: str):
        self.folder = folder.strip("/") or "music-app"
        try:
            import cloudinary
            import cloudinary.uploader as uploader
            import cloudinary.utils as cloudinary_utils
        except ImportError as exc:
            raise RuntimeError("cloudinary package is required for STORAGE_BACKEND=cloudinary") from exc

        self._cloudinary = cloudinary
        self._uploader = uploader
        self._utils = cloudinary_utils
        self._cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )

    async def save(self, file: UploadFile, owner_id: str) -> tuple[str, int]:
        ext = get_file_extension(file.filename or "")
        if ext not in ALLOWED_FORMATS:
            raise ValueError(f"Unsupported file extension: .{ext}")

        content = await file.read()
        public_id = f"{self.folder}/{owner_id}/{uuid.uuid4()}"
        result = self._uploader.upload(
            content,
            resource_type="video",
            public_id=public_id,
            overwrite=False,
            use_filename=False,
            unique_filename=False,
            format=ext,
        )
        return f"{CLOUDINARY_PREFIX}{result['public_id']}", len(content)

    def delete(self, file_path: str) -> None:
        if not file_path.startswith(CLOUDINARY_PREFIX):
            return
        public_id = file_path.replace(CLOUDINARY_PREFIX, "", 1)
        self._uploader.destroy(public_id, resource_type="video", invalidate=True)

    def get_absolute_path(self, file_path: str) -> str:
        return file_path

    def get_public_url(self, file_path: str) -> str | None:
        if not file_path.startswith(CLOUDINARY_PREFIX):
            return None
        public_id = file_path.replace(CLOUDINARY_PREFIX, "", 1)
        url, _ = self._utils.cloudinary_url(public_id, resource_type="video", secure=True)
        return url


def get_storage() -> StorageBackend:
    if settings.STORAGE_BACKEND == "local":
        return LocalStorageBackend(settings.LOCAL_STORAGE_PATH)

    if settings.STORAGE_BACKEND == "cloudinary":
        if not (
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        ):
            raise ValueError("Cloudinary credentials are required when STORAGE_BACKEND=cloudinary")
        return CloudinaryStorageBackend(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            folder=settings.CLOUDINARY_FOLDER,
        )

    raise ValueError(f"Unsupported storage backend: {settings.STORAGE_BACKEND}")


storage = get_storage()
