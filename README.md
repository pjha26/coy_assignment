# Coy Discover

Coy Discover is a standalone, single-user demo for browsing 30 fictional profiles and finding mutual matches. Swipe right to like, swipe left to pass, or use the **Like** and **Pass** buttons. A profile leaves the feed after a swipe. **Matches** shows people who liked you back.

## Run locally

Requires Node.js 22.13 or newer and npm.

```sh
npm ci
npm run dev
```

Open [Discover](http://localhost:3000/discover). On a fresh database, like **Anika** to see the match dialog. Open **Matches** and refresh to verify the match is saved. Use the half-circle button in the header to switch between the Paper and Darkroom themes.

## Checks

```sh
npm test
npm run build
```

Run `npm start` after building to serve the production build locally.

## API

| Method | Route | Behavior |
| --- | --- | --- |
| `GET` | `/feed` | Returns `{ profiles }` with unswiped profiles. |
| `POST` | `/swipe` | Accepts `{ "profileId": "p1", "action": "like" }` as JSON. `action` is `like` or `pass`. Returns `{ matched, match }`, where `match` is a public profile or `null`. |
| `GET` | `/matches` | Returns `{ matches }` with mutual matches, newest first. |

Retrying the same swipe returns the original result. An opposing swipe for a profile with a saved decision returns `409`.

## Data and privacy

Next.js serves the UI and API. SQLite saves swipes and seeded incoming likes in `.data/discover.sqlite`. Set `DISCOVER_DB_PATH` before starting the app to use a different database. Each database represents one demo user.

The server computes mutual matches from outgoing swipes and incoming likes. The feed returns public profile fields only. The API reveals a match only after a mutual like.
