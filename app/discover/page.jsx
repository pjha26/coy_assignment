'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { request, useCollection } from './api-client.js';
import { ProfileCard } from './profile-card.jsx';

function MatchDialog({ profile, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} className="match-dialog" aria-labelledby="match-title" onCancel={(event) => {
      event.preventDefault();
      onClose();
    }}>
      <img src={profile.photo} alt="" />
      <h2 id="match-title">It’s a match!</h2>
      <p>You and {profile.name} liked each other.</p>
      <button className="button primary" onClick={onClose} autoFocus>Keep discovering</button>
      <Link className="text-link" href="/discover/matches">View matches</Link>
    </dialog>
  );
}

export default function DiscoverPage() {
  const { items, error, reload } = useCollection('/feed', 'profiles');
  const [position, setPosition] = useState(0);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const [match, setMatch] = useState(null);
  const heading = useRef(null);
  const profile = items?.[position];

  async function saveSwipe(action) {
    setSaveError('');

    try {
      return await request('/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, action }),
      });

    } catch (error) {
      if (error.status === 409) {
        setPosition(0);
        setNotice('This profile was already swiped. The feed was refreshed.');
        reload();
      } else {
        setSaveError('Couldn’t save that swipe. Try the same action again.');
      }
      return null;
    }
  }

  function advance(action, result) {
    setPosition((index) => index + 1);
    setNotice(action === 'like' ? `Liked ${profile.name}.` : `Passed on ${profile.name}.`);
    setMatch(result.match);
  }

  function closeMatch() {
    setMatch(null);
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <section className="feed" aria-label="Profile feed">
      <p className="sr-only" role="status">{notice}</p>
      {error ? (
        <div className="state"><h2>Couldn’t load profiles</h2><button className="button primary" onClick={reload}>Try again</button></div>
      ) : !items ? (
        <p className="state" role="status">Loading profiles…</p>
      ) : !profile ? (
        <div className="state">
          <h2 ref={heading} tabIndex={-1}>You’re all caught up</h2>
          <p>You’ve seen every profile in Discover.</p>
          <Link className="button primary" href="/discover/matches">View matches</Link>
        </div>
      ) : (
        <>
          <ProfileCard profile={profile} headingRef={heading} onSave={saveSwipe} onAdvance={advance} />
          {saveError && <p className="save-error" role="alert">{saveError}</p>}
        </>
      )}
      {match && <MatchDialog profile={match} onClose={closeMatch} />}
    </section>
  );
}
