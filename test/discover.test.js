import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { feed, matches, swipe } from '../server/api.js';
import { openStore } from '../server/store.js';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'coy-test-'));
  const path = join(directory, 'discover.sqlite');
  const stores = [];
  const open = () => {
    const store = openStore(path);
    stores.push(store);
    return store;
  };
  t.after(() => {
    for (const store of stores) store.close();
    unlinkSync(path);
    rmdirSync(directory);
  });
  return { store: open(), open };
}

function submit(store, profileId, action) {
  return swipe(new Request('http://localhost/swipe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, action }),
  }), store);
}

test('feed exposes only public profile fields and matches start empty', async (t) => {
  const { store } = fixture(t);
  const response = feed(store);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const { profiles } = await response.json();
  assert.equal(profiles.length, 30);
  assert.equal(new Set(profiles.map(({ id }) => id)).size, 30);
  for (const profile of profiles) {
    assert.deepEqual(Object.keys(profile).sort(), ['age', 'bio', 'city', 'id', 'interests', 'name', 'photo']);
  }
  assert.deepEqual(await matches(store).json(), { matches: [] });
});

test('a match needs two likes and only mutual matches survive reopening the database', async (t) => {
  const { store, open } = fixture(t);
  const noMatch = { matched: false, match: null };
  assert.deepEqual(await (await submit(store, 'p2', 'like')).json(), noMatch);
  assert.deepEqual(await (await submit(store, 'p3', 'pass')).json(), noMatch);
  const result = await (await submit(store, 'p1', 'like')).json();
  assert.equal(result.matched, true);
  assert.equal(result.match.id, 'p1');
  assert.equal('incomingLikes' in result.match, false);

  const reopened = open();
  assert.deepEqual(await matches(reopened).json(), { matches: [result.match] });
  const { profiles } = await feed(reopened).json();
  assert.equal(profiles.length, 27);
  assert.equal(profiles[0].id, 'p4');
});

test('identical or conflicting requests across connections cannot change the first swipe', async (t) => {
  const { store, open } = fixture(t);
  const first = await (await submit(store, 'p1', 'like')).json();
  const other = open();
  assert.deepEqual(await (await submit(other, 'p1', 'like')).json(), first);
  assert.equal((await submit(other, 'p1', 'pass')).status, 409);
  assert.deepEqual(await matches(store).json(), { matches: [first.match] });
});

test('invalid inputs leave the feed intact and the feed empties after every valid swipe', async (t) => {
  const { store } = fixture(t);
  const bad = new Request('http://localhost/swipe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal((await swipe(bad, store)).status, 400);
  assert.equal((await swipe(new Request('http://localhost/swipe'), store)).status, 415);
  assert.equal((await submit(store, null, 'like')).status, 400);
  assert.equal((await submit(store, 'p1', 'other')).status, 400);
  assert.equal((await submit(store, 'missing', 'pass')).status, 404);
  const { profiles } = await feed(store).json();
  assert.equal(profiles.length, 30);
  for (const { id } of profiles) {
    assert.equal((await submit(store, id, 'pass')).status, 200);
  }
  assert.deepEqual(await feed(store).json(), { profiles: [] });
  assert.deepEqual(await matches(store).json(), { matches: [] });
});
