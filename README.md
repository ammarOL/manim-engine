# engine-manim

AI-assisted Manim scene generation with a Next.js UI and server-side Python rendering.

## Docker-First Quickstart (Recommended)

### 1) Configure env

```bash
cp .env.example .env.local
```

Set `GROQ_API_KEY` in `.env.local`.

### 2) Run in development

```bash
docker compose up --build
```

Open `http://localhost:3000`.

The app runs with hot reload and writes render artifacts under:
- `python/jobs`
- `public/jobs`

### 3) Stop

```bash
docker compose down
```

If you also want to remove dev volumes (including cached dependencies):

```bash
docker compose down -v
```

## Production Container

Build:

```bash
docker build -t engine-manim:latest .
```

Run:

```bash
docker run --rm -p 3000:3000 --env-file .env.local engine-manim:latest
```

## Optional Host-Native Setup (Without Docker)

You need Node.js + Python + Manim system dependencies (FFmpeg/LaTeX stack), then:

```bash
npm ci
npm run dev
```

## Troubleshooting

### Missing `GROQ_API_KEY`
- Symptom: generation endpoint fails quickly.
- Fix: ensure `.env.local` exists and includes a valid `GROQ_API_KEY`, then restart the container.

### Render failures inside container
- Symptom: `/api/generate` or `/api/compile` returns render errors.
- Fix: inspect container logs with `docker compose logs -f app` and verify the generated Manim code is valid.

### Slow or failing renders
- Symptom: long render times, process crashes, or unstable behavior.
- Fix: allocate more Docker memory/CPU, reduce scene complexity, and retry.

## Security Note

- Never commit `.env.local`.
- Rotate any key that was accidentally shared in commits, screenshots, terminal history, or chat.
