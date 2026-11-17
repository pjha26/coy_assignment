'use client';

import { useEffect, useState } from 'react';

export async function request(path, options) {
  const response = await fetch(path, { ...options, cache: 'no-store' });
  if (!response.ok) {
    const error = new Error('The request failed.');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export function useCollection(path, key) {
  const [state, setState] = useState({ items: null, error: false });
  const [attempt, setAttempt] = useState(0);

  function reload() {
    setState({ items: null, error: false });
    setAttempt((count) => count + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    request(path, { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setState({ items: result[key], error: false });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ items: null, error: true });
    });
    return () => controller.abort();
  }, [path, key, attempt]);

  return { ...state, reload };
}
