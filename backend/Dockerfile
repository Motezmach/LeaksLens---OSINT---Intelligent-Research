# syntax=docker/dockerfile:1.7
# Multi-stage Alpine build: compile wheels in the builder, ship a minimal,
# non-root runtime.

############################
# Stage 1 - builder
############################
FROM python:3.12-alpine AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Build deps only needed to compile any wheels without musl prebuilds.
RUN apk add --no-cache build-base libffi-dev

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

############################
# Stage 2 - runtime
############################
FROM python:3.12-alpine AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# libffi for cryptography/bcrypt at runtime; wget (busybox) for healthcheck.
RUN apk add --no-cache libffi \
    && addgroup -S -g 1000 leaklens \
    && adduser -S -u 1000 -G leaklens -h /app -s /sbin/nologin leaklens

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=leaklens:leaklens app ./app

USER leaklens

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8000/health >/dev/null 2>&1 || exit 1

# Trust X-Forwarded-* only from the Docker bridge (Caddy reverse proxy),
# never from arbitrary clients - prevents IP spoofing / rate-limit bypass.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips=127.0.0.1,172.16.0.0/12"]
