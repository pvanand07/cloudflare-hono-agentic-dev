# Architecture

## Stack

- Runtime: Cloudflare Workers
- Framework: Hono, with `hono/jsx-renderer` for server-rendered pages
- Dev server: `wrangler dev` directly — no Vite, no separate dev toolchain
- Static assets: Workers Static Assets (`assets.directory` in `wrangler.jsonc`), served from `public/`
- Database: Cloudflare D1 (SQLite at the edge)
- ORM: Drizzle (`drizzle-orm/d1`), migrations via `drizzle-kit`
- API validation: `@hono/zod-validator` (plain, no OpenAPI generation — add `@hono/zod-openapi` later if external API consumers need a spec)
- Deployment: Wrangler

## Why no Vite

The `+vite` template adds `@cloudflare/vite-plugin` and `vite-ssr-components` on top of Wrangler for HMR. For this MVP, `wrangler dev` alone is simpler and has one fewer toolchain to keep in sync — it already reloads on save, and JSX/SSR work the same either way through `hono/jsx-renderer`. Revisit if the dev-server UX becomes a real bottleneck.

## Data model

Describe entities and relationships here as they're added.
