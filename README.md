# Speak City

Learn the ~5000 most useful English words from the vocabulary book by walking into 3D scenes,
tapping things to learn their names, and talking to people. One scene = one page of the book.

```
apps/web         Next.js 15 (App Router, Server Components) + React Three Fiber — the game
apps/api         NestJS 11 + Drizzle ORM + MySQL — accounts, scenes, progress, spaced repetition
packages/shared  Scene schema (zod), review scheduling, and the scene content (content/scenes/*.json)
```

## Run it locally

Needs Node 22, pnpm 10 (`corepack enable`) and Docker (for MySQL).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm db:up                     # MySQL in Docker on :3306
pnpm build:shared
pnpm db:migrate                # create tables
pnpm db:seed                   # load the scenes from packages/shared/content/scenes
pnpm dev                       # web on http://localhost:3000, API on http://localhost:4000/api
```

Open http://localhost:3000, make an account, and pick a scene on the map.

## How it fits together

- The browser only talks to Next.js. Server Components and Server Actions (`apps/web/src/app/actions.ts`)
  call the API with the user's JWT, which lives in an httpOnly cookie (`sc_token`).
- The API keeps the book's dictionary (`words`), which scene teaches which word (`scene_words`),
  and every word each user has found (`user_words`) with its Leitner box and next review date.
- A word that appears in several scenes (e.g. *dumplings*) is learned once and counts once toward 5000.

### API

| Method | Path | |
|---|---|---|
| POST | `/api/auth/register` · `/api/auth/login` | returns `{ token }` |
| GET | `/api/me` | user + `wordsFound`, `due`, `bookTotal` |
| GET | `/api/scenes` | the map, with found/total words per scene |
| GET | `/api/scenes/:slug` | scene content + words this user already found |
| POST | `/api/scenes/:slug/complete` | `{ mistakes }` |
| POST | `/api/progress/words` | `{ words: string[] }` → marks words found |
| GET | `/api/review?limit=30` | words due now |
| POST | `/api/review/:wordId` | `{ grade: "again" \| "hard" \| "good" }` |

## Adding a scene (a new page of the book)

1. Add `packages/shared/content/scenes/<slug>.json` following `SceneDef` in `packages/shared/src/schema.ts`:
   the page's `words` (only words from that page), `props` placed in the world, `npcs`, `dialogues`, and the `quest`.
2. Every `word` used by a prop, NPC, item or dialogue must be in the scene's `words`; the loader checks this.
3. New prop types go in `apps/web/src/components/game/props/Props.tsx` (`PROPS` registry); new foods in `Food.tsx`.
4. `pnpm db:seed` — the scene appears on the map.

## Characters

`apps/web/public/models` holds three sample Mixamo-rigged characters from the three.js examples
(Michelle, Soldier, Xbot). They are placeholders for development. For the real product, download your own
characters and animations from [Mixamo](https://www.mixamo.com) (free with an Adobe account, usable in commercial
projects), export as glTF/glb in T-pose with the `mixamorig` skeleton, and point `MODEL_FILES` in
`apps/web/src/components/game/Npc.tsx` at them. Animations are retargeted at runtime, so any Mixamo character works.

## Deploy (one server, e.g. a DigitalOcean droplet)

```bash
# on the server, with Docker installed and your domain's A record pointing at it
git clone https://github.com/OusamaMahmoud/speak-city && cd speak-city
cp .env.production.example .env.production    # set DOMAIN, passwords, JWT_SECRET
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Caddy serves the site on 80/443 with automatic HTTPS. The API and MySQL are not exposed to the internet.
The API container applies migrations and re-seeds scenes on every start (safe to repeat).
To test over plain http before you have a domain, set `DOMAIN=:80` and `INSECURE_COOKIES=1`.
