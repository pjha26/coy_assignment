import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { incomingLikes, profiles } from './profiles.js';

const byId = new Map(profiles.map((profile) => [profile.id, profile]));

export function openStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS swipes (
      profile_id TEXT NOT NULL UNIQUE,
      action TEXT NOT NULL CHECK (action IN ('like', 'pass'))
    );
  `);
  const listSwipes = db.prepare('SELECT profile_id FROM swipes');
  const listLikes = db.prepare("SELECT profile_id FROM swipes WHERE action = 'like' ORDER BY rowid DESC");
  const insert = db.prepare('INSERT INTO swipes (profile_id, action) VALUES (?, ?) ON CONFLICT (profile_id) DO NOTHING');
  const findSwipe = db.prepare('SELECT action FROM swipes WHERE profile_id = ?');

  return {
    feed() {
      const seen = new Set(listSwipes.all().map(({ profile_id }) => profile_id));
      return profiles.filter(({ id }) => !seen.has(id));
    },
    swipe(profileId, action) {
      const profile = byId.get(profileId);
      if (!profile) return { status: 404, error: 'Profile not found.' };

      insert.run(profileId, action);
      // The first action wins even when separate connections write simultaneously.
      if (findSwipe.get(profileId).action !== action) {
        return { status: 409, error: 'This profile has already been swiped.' };
      }
      const matched = action === 'like' && incomingLikes.has(profileId);
      return { matched, match: matched ? profile : null };
    },
    matches() {
      return listLikes.all()
        .map(({ profile_id }) => profile_id)
        .filter((id) => incomingLikes.has(id))
        .map((id) => byId.get(id));
    },
    close() { db.close(); },
  };
}

let store;
export function getStore() {
  return store ??= openStore(resolve(process.env.DISCOVER_DB_PATH || '.data/discover.sqlite'));
}
