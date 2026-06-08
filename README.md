# sceniK Frontend

Vue/Vite frontend for sceniK. This folder is intended to become the
`sceniK-front` repository.

## Architecture Rule

- The frontend calls only the Spring Boot backend.
- The frontend must never call `sceniK-ai` directly.
- Do not place private API keys or backend secrets in frontend code.

## Setup

```powershell
cd frontend
npm install
```

## Development

```powershell
npm run dev
```

The Vite dev server runs on `http://127.0.0.1:5173/` by default.

## Build And Checks

```powershell
npm run lint
npm run build
npm run smoke:errors
npm run smoke:course
```

## Environment

Copy `.env.example` to `.env` when needed.

```text
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_LOCAL_AI_FALLBACK=false
```

When using the Vite proxy, `/api/*` should still resolve to the Spring Boot
backend. Do not configure this app to call the FastAPI AI server directly.

## Troubleshooting

- If API calls fail with a network error, confirm the Spring Boot backend is
  running on port `8080`.
- If signup fails for a short password, use at least 8 characters.
- If old local data looks inconsistent, reset backend MySQL and sign in again.
