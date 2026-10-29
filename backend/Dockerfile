FROM python:3.12-slim AS build
WORKDIR /srv
ENV PIP_NO_CACHE_DIR=1
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY pyproject.toml ./
# Install dependencies only (no app code yet) so this layer is cached between code changes.
RUN python - <<'PY' > requirements.txt
import tomllib
print("\n".join(tomllib.load(open("pyproject.toml", "rb"))["project"]["dependencies"]))
PY
RUN pip install -r requirements.txt

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/opt/venv/bin:$PATH"
WORKDIR /srv
COPY --from=build /opt/venv /opt/venv
COPY app ./app
COPY scripts ./scripts
COPY data ./data

RUN useradd -r -u 1001 appuser && chown -R appuser /srv
USER appuser

EXPOSE 8000
# Behind Heroku's router the client IP is in X-Forwarded-For; trust it so rate limits are per user.
CMD ["sh", "-c", "gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:${PORT:-8000} --forwarded-allow-ips='*'"]
