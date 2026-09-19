# SETUP.md

Steps used to create this project from scratch. Run in order.

## 1. Scaffold the base app

```bash
npm create hono@latest project-template -- --template cloudflare-workers --pm npm --install
cd project-template
rm -f pnpm-workspace.yaml
```

Uses Hono's own scaffolder, the plain `cloudflare-workers` template — no Vite. Gives you `src/index.ts`, `wrangler.jsonc`, `package.json`, `tsconfig.json` (already configured for `hono/jsx`).

## 2. Install D1 / Drizzle / validation packages

```bash
npm install drizzle-orm @hono/zod-validator zod
npm install -D drizzle-kit typescript
```

`typescript` is not a transitive dependency of anything in this stack — install it explicitly. Without it, `npx tsc` can silently resolve to an unrelated npm package that prints a warning and exits 0, so a CI typecheck step passes vacuously. Confirm the real compiler is installed: check `node_modules/typescript/package.json` has `homepage: "https://www.typescriptlang.org/"`.

## 3. Add the DB schema

Write `src/db/schema.ts` (Drizzle table definitions, `drizzle-orm/sqlite-core`) and `src/db/client.ts` (`drizzle(env.DB)` factory).

Write `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/db/schema.ts',
  out: './migrations',
})
```

## 4. Generate the first migration

```bash
npx drizzle-kit generate --name init
```

Produces real SQL under `migrations/`. Don't hand-write migration files.

## 5. Add the JSX renderer and page routes

```tsx
// src/renderer.tsx
import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => (
  <html><head><link href="/style.css" rel="stylesheet" /></head><body>{children}</body></html>
))
```

Page routes go in `src/routes/pages/*.tsx`, rendered through `c.render(...)`.

## 6. Add API routes

`src/routes/api/*.ts`, using `zValidator` from `@hono/zod-validator` for request bodies. No OpenAPI generation — add `@hono/zod-openapi` later if external consumers need a spec.

## 7. Wire the entry point

Rename `src/index.ts` to `src/index.tsx` (it now renders JSX). Mount both routers:

```tsx
app.use(renderer)
app.route('/api/examples', exampleApi)
app.route('/', pages)
```

## 8. Add static assets and the D1 binding

Create `public/` for real static files. Edit `wrangler.jsonc`:

```jsonc
"assets": { "directory": "public" },
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "<project>-db",
    "database_id": "<run: wrangler d1 create <project>-db>",
    "migrations_dir": "migrations"
  }
]
```

## 9. Generate binding types

```bash
npm run cf-typegen
```

Runs `wrangler types --env-interface CloudflareBindings`, writes `worker-configuration.d.ts`. Use `Hono<{ Bindings: CloudflareBindings }>()` everywhere — don't hand-write a `Bindings` type. Rerun after every `wrangler.jsonc` change.

## 10. Pin dependency versions exactly

Edit `package.json`: remove every `^` and `~`. Regenerate the lockfile:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 11. Verify

```bash
npx tsc --noEmit -p tsconfig.json
npx wrangler deploy --dry-run
npx wrangler d1 migrations apply <db-name> --local
npm run dev
# in another shell:
curl -X POST http://localhost:8787/api/examples -H "Content-Type: application/json" -d '{"name":"smoke-test"}'
curl http://localhost:8787/api/examples
curl http://localhost:8787/
curl -o /dev/null -w "%{http_code}\n" http://localhost:8787/style.css
```

All of the above must pass — typecheck, dry-run bundle, and an actual write/read against local D1 through the running dev server, not just a static check.

## 12. Fill in project files

Add `docs/domain.md`, `docs/architecture.md`, `docs/adr/`, `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, `AGENT.md`, `CLAUDE.md`, `README.md`, `LICENSE`, `.env.example`, `.dev.vars.example`, `.github/workflows/ci.yml`.

No test runner. CI runs typecheck and `wrangler deploy --dry-run` only.

## 13. Set up Matt Pocock's skills (optional, once per repo)

If this repo uses the `mattpocock/skills` set (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `code-review`, etc. — see `AGENT.md`'s Flow section), run this once the repo has a real git remote, before using any of those skills for real.

Install the skills first:

```bash
npx skills@latest add mattpocock/skills
```

Then run the setup skill:

```
/setup-matt-pocock-skills
```

It's non-invokable — the agent never reaches for it on its own, someone has to type the command. It reads `git remote`, proposes GitHub as the issue tracker, and writes `docs/agents/issue-tracker.md` and `docs/agents/domain.md`, replacing the stubs from step 12. It also appends an `## Agent skills` block to `CLAUDE.md`.

Two things it does **not** do:

- `docs/agents/triage-labels.md` is only written if the `triage` skill is installed. This template's `AGENT.md` flow doesn't use `triage` — skip expecting this file unless `triage` gets added later.
- It maps label *names* to roles, it doesn't create them. On a fresh GitHub repo, `ready-for-agent`, `needs-info`, `ready-for-human`, `wontfix` still need to be created by hand (`gh label create ...`) the first time.

Re-run it only to switch trackers or start over — not on every session.

## 14. Clean up before committing

```bash
rm -rf node_modules dist package-lock.json .wrangler
```

Regenerated by `npm install` / `wrangler dev` / `wrangler deploy` respectively. Don't ship them in the template.
