FROM node:20-bookworm-slim AS base

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    libcairo2 \
    libpango-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi8 \
    shared-mime-info \
    texlive \
    texlive-latex-extra \
    texlive-fonts-recommended \
    dvisvgm \
    && rm -rf /var/lib/apt/lists/*

ARG MANIM_VERSION=0.20.1
RUN pip3 install --break-system-packages "manim==${MANIM_VERSION}"

COPY package*.json ./

FROM base AS dev

ENV NODE_ENV=development

RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

FROM base AS builder

ENV NODE_ENV=development

RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
