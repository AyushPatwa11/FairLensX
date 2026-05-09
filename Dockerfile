# Root Dockerfile for Render — builds the backend
FROM python:3.11-slim
WORKDIR /app

# Install backend requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source into image
COPY backend/ ./

ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
