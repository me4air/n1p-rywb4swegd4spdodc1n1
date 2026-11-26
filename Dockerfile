# Бэкенд аналитики + сам прототип в одном контейнере (Railway собирает его автоматически)
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONUTF8=1 STATIC_DIR=/app/site
WORKDIR /app
COPY server/server.py server/viewer.html /app/server/
COPY index.html styles.css robots.txt *.js /app/site/
COPY assets/ /app/site/assets/
CMD ["python", "server/server.py"]
