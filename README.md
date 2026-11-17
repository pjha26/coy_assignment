# Coy Discover

A standalone demo for the Coy SDE internship assignment. Discover lets a single demo user swipe fictional profiles and see mutual matches. Home is an empty placeholder.

See the [implementation plan](IMPLEMENTATION-PLAN.md) for the requirements, API behavior, and verification checklist.

## Run locally

Use Node.js 22.13 or newer with npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000` and choose **Discover**. On a fresh database, like Anika to see the match dialog. Open **Matches**, refresh, and confirm Anika is still listed. Return to **Profiles** to continue with the next profile. Drag a card left or right on mobile, or use the Pass and Like buttons.

```sh
npm test
npm run build
npm start
```

## API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/feed` | `{ profiles }` contains only profiles that have not been swiped. |
| POST | `/swipe` | Accepts `{ "profileId": "p1", "action": "like" }`. Returns `{ matched, match }`, where `match` is a public profile on a mutual like and otherwise `null`. |
| GET | `/matches` | `{ matches }` contains mutual matches, most recent first. |

Send swipes with `Content-Type: application/json`. Invalid input returns `400`, unknown profiles return `404`, changing an already saved swipe returns `409`, and other content types return `415`. Retrying the original action is safe. Profile portraits are generated placeholders.

## Architecture

- `app/discover/` reads the feed and matches through HTTP. The profile card owns gestures, buttons, and animation. The Discover page advances the feed after a save and handles match dialogs and retry feedback.
- `app/*/route.js` defines the HTTP entry points. `server/api.js` validates requests and shapes the responses. `server/store.js` owns persistence and determines mutual matches. The client does not import these modules.
- SQLite records one immutable swipe per profile, even when requests from multiple tabs arrive together. Fictional incoming likes are seeded into SQLite once when a database is initialized or upgraded. The server combines these two records to determine a match. Incoming like records stay on the server, and only public profile details are returned for mutual matches.

SQLite writes to `.data/discover.sqlite`. To use a fresh or separate database, set `DISCOVER_DB_PATH` to a different file before starting the server. Runtime data is ignored by Git. For a hosted demo, run the Node server with a writable persistent directory. Everyone who opens the same instance shares the one demo user's state.

## Product review

Part A is a separate write-up based on the live Coy app walkthrough. Include two proposed features with reasons when submitting the assignment.
