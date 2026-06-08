# AGENTS.md

## Scope

This folder is the Vue/Vite frontend for sceniK and is intended to become the
`sceniK-front` repository.

## Rules

- Keep the app mobile-first and preserve the existing five-tab navigation:
  AI Course, Explore, Home, Community, My Page.
- The frontend must call only the Spring Boot backend through `/api` or
  `VITE_API_BASE_URL`.
- Never call `sceniK-ai` directly from frontend code.
- Do not commit secrets or private API keys.
- Avoid localStorage as the source of truth for backend-backed data such as
  auth, routes, posts, comments, likes, visit status, reports, and notifications.
- localStorage may remain for temporary UI state, filters, drafts, and explicit
  fallback caches.
- Use user-friendly Korean error messages for API and form failures.
- Keep the current sceniK visual identity: scenic, cinematic, warm,
  trustworthy, and Korean-travel focused.
- Do not add React, Next.js, Tailwind, Bootstrap, or external UI libraries unless
  explicitly approved.

## Validation

Before finalizing frontend work, run:

```powershell
npm run build
```

Run lint and smoke scripts when relevant:

```powershell
npm run lint
npm run smoke:errors
npm run smoke:course
```
