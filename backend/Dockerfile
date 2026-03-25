FROM python:3.12-slim

WORKDIR /app

# Cài dependencies trước để tận dụng Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Tạo thư mục uploads
RUN mkdir -p uploads

EXPOSE 8000

# Chạy migration rồi khởi động server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
