# MusicApp

Web nghe nhạc cá nhân, cho phép đăng ký/đăng nhập, upload nhạc, phát nhạc online, quản lý playlist và trải nghiệm player hiện đại trên cả laptop lẫn mobile.

## Giới thiệu

MusicApp là dự án fullstack gồm:
- `backend`: FastAPI + SQLAlchemy + JWT auth
- `frontend`: React + Vite + TypeScript + Tailwind CSS

Ứng dụng hỗ trợ:
- Đăng ký / đăng nhập bằng email-password
- Đăng nhập Google (khi cấu hình Google Client ID)
- Upload và phát nhạc các định dạng: `mp3`, `wav`, `flac`, `m4a`
- Tạo playlist, thêm/xóa bài hát
- Đổi tên bài hát trực tiếp trong thư viện
- Shuffle / next / prev / hẹn giờ tắt nhạc
- Màn hình `Đang phát` với hiệu ứng đĩa nhạc xoay

## Tính năng nổi bật

- Giao diện responsive cho mobile và desktop
- API stream/download bài hát có xác thực token
- Hỗ trợ local storage hoặc Cloudinary cho file nhạc
- Backend tự khởi tạo bảng khi startup
- CORS cấu hình cho môi trường local + Railway

## Cấu trúc thư mục

```txt
Music/
├─ backend/
│  ├─ app/
│  ├─ alembic/
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ src/
│  ├─ package.json
│  └─ vite.config.ts
└─ README.md
```

## Chạy local

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy ở `http://127.0.0.1:5173`.

## Biến môi trường

### Backend (`backend/.env`)

Tham khảo từ `backend/.env.example`:

- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `GOOGLE_CLIENT_ID`
- `CORS_ALLOWED_ORIGINS`
- `STORAGE_BACKEND` (`local` hoặc `cloudinary`)
- `LOCAL_STORAGE_PATH`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

### Frontend

Có thể tạo `.env` trong `frontend/`:

- `VITE_API_URL=https://your-backend-domain`
- `VITE_GOOGLE_CLIENT_ID=your_google_client_id`

## Deploy Railway

### Backend

1. Kết nối repo với Railway service backend.
2. Set các biến môi trường backend (đặc biệt `DATABASE_URL`, `SECRET_KEY`, `CORS_ALLOWED_ORIGINS`).
3. Redeploy.

### Frontend

1. Kết nối repo với Railway service frontend.
2. Set:
   - `VITE_API_URL` trỏ tới backend Railway
   - `VITE_GOOGLE_CLIENT_ID` (nếu dùng Google login)
3. Redeploy.


