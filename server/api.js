import { getStore } from './store.js';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function feed(store = getStore()) {
  return json({ profiles: store.feed() });
}

export function matches(store = getStore()) {
  return json({ matches: store.matches() });
}

export async function swipe(request, store) {
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    return json({ error: 'Use Content-Type application/json.' }, 415);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Send a JSON request body.' }, 400);
  }
  if (typeof body?.profileId !== 'string' || !body.profileId.trim() ||
      (body.action !== 'like' && body.action !== 'pass')) {
    return json({ error: 'Provide a profileId and an action of like or pass.' }, 400);
  }

  const result = (store ?? getStore()).swipe(body.profileId, body.action);
  if ('error' in result) return json({ error: result.error }, result.status);
  return json(result);
}
