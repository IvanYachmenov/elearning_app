FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN useradd --create-home --shell /usr/sbin/nologin runner

WORKDIR /app
COPY server.py .

RUN chown -R runner:runner /app
USER runner

EXPOSE 8080

CMD ["python", "server.py"]
