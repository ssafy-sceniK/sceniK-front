# Frontend State Migration Checklist

The frontend should keep business data backend-backed wherever possible. Local storage is allowed only for UI state and explicit fallback caches.

## Must Be Backend-Backed

| Data | Backend Status | Frontend Status |
| --- | --- | --- |
| posts | Implemented | Frontend calls `/api/posts`. |
| comments | Implemented | Frontend calls `/api/posts/{postId}/comments`. |
| post likes | Implemented | Frontend calls `/api/posts/{postId}/likes`. |
| liked contents | Implemented | Uses backend engagement APIs. |
| liked places | Implemented | Uses backend engagement APIs. |
| visit status | Implemented | Uses `PUT/DELETE /api/places/{placeId}/visit-status`. |
| saved routes | Implemented | Uses route APIs and is excluded from UI localStorage persistence. |
| notifications | Implemented as simple list | Frontend can call `/api/notifications` when wired. |
| reports | Implemented | Frontend calls `/api/posts/{postId}/reports`. |

## May Remain Local

| Data | Reason |
| --- | --- |
| temporary UI state | Modal/sheet open state, active tabs, local toggles. |
| filters | Search/filter choices are UI preferences. |
| search keyword | Short-lived UI state. |
| draft input | Useful for preserving user input before submit. |
| AI fallback cache | Allowed only for demo resilience when backend AI route generation is unavailable. |
| generated route before save | Result/edit flow state before it becomes a saved backend route. |
| recent viewed places | UI convenience state unless product later requires cross-device sync. |

## Migration Rules

- Do not treat localStorage as the source of truth for auth-required business data.
- Auth tokens may remain in localStorage for the current MVP, but user profile and protected data should be refetched from the backend.
- When backend endpoints are missing, show an error or login-required state instead of silently pretending success.
- Keep compatibility mappers small and localized inside API modules.

## Current Gaps

- Community scrap state has no backend contract yet.
