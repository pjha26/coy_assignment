import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { profiles } from './profiles.js';

const byId = new Map(profiles.map((profile) => [profile.id, profile]));
const seedIncomingLikes = ['p1', 'p3', 'p7', 'p12', 'p18', 'p24', 'p28'];

export function openStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec(`
      PRAGMA busy_timeout = 5000;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS swipes (
        profile_id TEXT NOT NULL UNIQUE,
        action TEXT NOT NULL CHECK (action IN ('like', 'pass'))
      );
      CREATE TABLE IF NOT EXISTS incoming_likes (
        profile_id TEXT PRIMARY KEY NOT NULL
      );
    `);
    // Version 0 also covers databases from the first release with saved swipes.
    if (db.prepare('PRAGMA user_version').get().user_version === 0) {
      const seed = db.prepare('INSERT INTO incoming_likes (profile_id) VALUES (?)');
      for (const id of seedIncomingLikes) seed.run(id);
      db.exec('PRAGMA user_version = 1');
    }
    db.exec('COMMIT');
  } catch (error) {
    db.close();
    throw error;
  }
  const listSwipes = db.prepare('SELECT profile_id FROM swipes');
  const listMatches = db.prepare(`
    SELECT swipes.profile_id FROM swipes JOIN incoming_likes USING (profile_id)
    WHERE swipes.action = 'like' ORDER BY swipes.rowid DESC
  `);
  const insert = db.prepare('INSERT INTO swipes (profile_id, action) VALUES (?, ?) ON CONFLICT (profile_id) DO NOTHING');
  const findSwipe = db.prepare(`
    SELECT swipes.action, incoming_likes.profile_id IS NOT NULL AS liked_back
    FROM swipes LEFT JOIN incoming_likes USING (profile_id) WHERE swipes.profile_id = ?
  `);

  return {
    feed() {
      const seen = new Set(listSwipes.all().map(({ profile_id }) => profile_id));
      return profiles.filter(({ id }) => !seen.has(id));
    },
    swipe(profileId, action) {
      const profile = byId.get(profileId);
      if (!profile) return { status: 404, error: 'Profile not found.' };

      insert.run(profileId, action);
      const saved = findSwipe.get(profileId);
      // The first action wins even when separate connections write simultaneously.
      if (saved.action !== action) {
        return { status: 409, error: 'This profile has already been swiped.' };
      }
      const matched = saved.action === 'like' && saved.liked_back === 1;
      return { matched, match: matched ? profile : null };
    },
    matches() {
      return listMatches.all().map(({ profile_id }) => byId.get(profile_id)).filter(Boolean);
    },
    close() { db.close(); },
  };
}

let store;
export function getStore() {
  return store ??= openStore(resolve(process.env.DISCOVER_DB_PATH || '.data/discover.sqlite'));
}
