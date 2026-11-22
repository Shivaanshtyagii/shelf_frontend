# Shelf web

Next.js App Router and TypeScript. The four primary routes are Explore, Your College, Upload / Scan, and My Stuff. Account and moderation are separate routes. Route files in `src/app` compose screens. Each folder in `src/features` owns a workflow or business domain, including its API types in `model.ts` where needed. For example, Upload composes the local scanner with the listing editor, and My Stuff composes the pickup panel with account activity. Reusable UI lives in `src/ui`. Shared HTTP transport and display formatting live in `src/lib`.

## Local development

Use Node.js 22 or later. Start the [Spring Boot backend](../backend/README.md), then run these commands from `frontend`.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Requests to `/api` are forwarded to Spring Boot on port 8080 by default. Set `SHELF_API_ORIGIN` before running or building Next.js if the API uses a different origin. Hosting the UI and API under a single public origin allows the frontend to use same-origin session cookies and CSRF protection.

Camera capture is supported by the device file picker when available. Scan conversion and PDF download run locally. Saving a cloud attachment requires a verified account and the backend's upload capability.

```sh
npm run typecheck
npm test
npm run build
```
