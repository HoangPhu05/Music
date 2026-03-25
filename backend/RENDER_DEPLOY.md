# Render Deploy Guide

## 1) Create services
- Create a **Web Service** for this backend repo/folder.
- Create a **PostgreSQL** database on Render.

## 2) Build and start commands
- Build Command:
`pip install -r requirements.txt`
- Start Command:
`alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## 3) Environment variables
Set these in Render Web Service:

- `DATABASE_URL` = value from Render Postgres (internal URL)
- `SECRET_KEY` = long random string
- `ALGORITHM` = `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` = `30`
- `STORAGE_BACKEND` = `cloudinary`
- `CLOUDINARY_CLOUD_NAME` = your Cloudinary cloud name
- `CLOUDINARY_API_KEY` = your Cloudinary API key
- `CLOUDINARY_API_SECRET` = your Cloudinary API secret
- `CLOUDINARY_FOLDER` = `music-app` (or your folder name)
- `CORS_ALLOWED_ORIGINS` = frontend URLs, comma separated
  - example: `https://your-frontend.onrender.com,https://your-domain.com`

## 4) Frontend variable
In your frontend service, set:
- `VITE_API_URL` = your backend public URL
  - example: `https://your-backend.onrender.com`

## 5) Notes
- This app auto-normalizes `DATABASE_URL` for async SQLAlchemy (`asyncpg`).
- In production, uploaded audio is stored on Cloudinary, not local disk.
