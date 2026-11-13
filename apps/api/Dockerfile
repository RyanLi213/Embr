# Build stage: install dependencies with uv
FROM python:3.13-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:0.13.8 /uv /bin/uv
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev

# Run stage: small image, runs as a non-root user
FROM python:3.13-slim
RUN useradd --create-home --uid 1000 embr
WORKDIR /app
COPY --from=builder --chown=embr:embr /app /app
USER embr
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "embr_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
