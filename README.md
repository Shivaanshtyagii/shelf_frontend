# Shelf web

Next.js App Router and TypeScript. The four primary routes are Explore, Your College, Upload / Scan, and My Stuff. Account and moderation are separate routes. Route files in `src/app` compose screens. Each folder in `src/features` owns a workflow or business domain, including its API types in `model.ts` where needed. For example, Upload composes the local scanner with the listing editor, and My Stuff composes the pickup panel with account activity. Reusable UI lives in `src/ui`. Shared HTTP transport and display formatting live in `src/lib`.

## Local development

Use Node.js 22 or later. Start the [Spring Boot backend](../backend/README.md), then run these commands from `frontend`.

```sh
npm ci
npm run dev:neon
```

Open http://localhost:3000. The frontend handles Neon Auth at `/api/auth` and forwards app requests from `/api/shelf` to Spring Boot on port 8080 by default. Set `SHELF_API_ORIGIN` if Spring runs on a different address. The [backend setup instructions](../backend/README.md#managed-neon-sign-in-on-the-development-branch) list the Neon Auth variables needed in `frontend/.env.local`.

Camera capture is supported by the device file picker when available. Scan conversion and PDF download run locally. Saving a cloud attachment requires a verified account and the backend's upload capability.

```sh
npm run typecheck
npm test
npm run build
```
