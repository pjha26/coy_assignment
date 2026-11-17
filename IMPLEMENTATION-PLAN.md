# Coy Discover implementation plan

## 1. Scope and deliverables

Part A is a product review. Walk through Coy's phone OTP login, adding a crush, email verification, invite link, and extra-slots screen without making a purchase. Record where a user gets stuck or lacks information. Pick two core feature ideas grounded in those observations. For each, describe the problem, the change, why it would help, and how it preserves Coy's privacy promise. Include the finished write-up with the submission.

Part B is a standalone, mobile-first Next.js app. Use the App Router, React, plain CSS, and SQLite via Node.js. Leave Home empty apart from the shared navigation. Put the swipe feed and the Matches view inside Discover. Use one assumed demo user. The submission is the source in a public GitHub repository, with setup instructions and checks a reviewer can run.

## 2. Data and privacy

- Seed 30 fictional adult profiles with stable IDs, name, age, local placeholder portrait, short bio, city or college, and interests. Keep the order predictable for a demo.
- Keep simulated incoming likes on the server, separate from profile objects. Seed a few incoming likes, including early in the feed, to make a match easy to demonstrate.
- Save one swipe per profile in SQLite. Restrict the action to `like` or `pass`. Use the profile ID as the unique key because the assignment assumes a single user.
- A match is derived from two facts: an incoming like exists and the stored outgoing action is `like`. A pass never matches. This keeps one source of truth and lets the Matches view rebuild after reload or server restart.
- Public profile objects contain display fields only. Browser bundles, feed responses, non-match responses, and error messages do not carry incoming-like flags or lists. The public repository contains fictional fixtures only.
- Keep SQLite data outside the public folder and out of Git. A self-hosted Node process with a writable local directory is enough for this assignment.

## 3. API contract

| Route | Input and result |
| --- | --- |
| `GET /feed` | Return `{ profiles }`, containing only unreviewed profiles. Return an empty array after the last swipe. Disable caching. |
| `POST /swipe` | Accept `{ profileId, action }`. Validate JSON and action, reject an unknown profile ID, atomically save the first action, and return `{ matched, match }`. `match` is a public profile only for a mutual like. |
| `GET /matches` | Return `{ matches }` with mutual matches, newest first. Disable caching. |

Retrying the same swipe returns the same outcome without creating a second swipe or match. A different action for the same profile returns `409` so a stale tab cannot overwrite a swipe. Use `400` for malformed input, `404` for unknown profiles, and `415` for requests without the `application/json` media type. Unexpected storage failures give the UI a generic error and a retry path.

## 4. Discover interface

- Load the feed when Discover opens. Show a loading message, retryable error, or a single card with all profile details. Give a clear explanation and a link to Matches when the feed is empty.
- Support dragging right to like and left to pass. Show a Like or Pass cue while dragging, snap back below the threshold, and restore the card on a cancelled gesture. Support keyboard and pointer input with visible Like and Pass buttons.
- Lock the card while a swipe is saving. Advance and animate it only after server acknowledgement. Restore it and show an error on a failed save. If another tab already saved a different swipe, refresh the feed.
- When a swipe returns a mutual match, display an “It's a match!” dialog with the matched profile. Offer actions to keep discovering or open Matches. Display the persisted mutual matches and an empty state inside Discover.
- Use readable mobile layouts, visible keyboard focus, reduced-motion support, and status messages that assistive technology can announce.

## 5. Build order and verification

1. Scaffold Next.js and add fictional fixture data and local portrait assets.
2. Implement the SQLite store and API handlers. Verify the three main outcomes independently: like with incoming interest, like without it, and pass on a profile that had liked the user.
3. Build the navigation, swipe card, gesture handling, feedback, and Matches view. Wire the UI to the real API.
4. Test missing or invalid input, duplicate or opposing requests, privacy of responses, full feed exhaustion, and persistence after reopening the database. Build for production and run a browser walkthrough for desktop buttons, mobile drag, dialog, and reload.
5. Include a README with setup, the API contract, demo steps, and the single-user storage assumption. Add the two Part A proposals after the live app walkthrough. Review repository contents before making it public.
