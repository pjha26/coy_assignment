'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { request, useCollection } from './api-client.js';

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
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const [match, setMatch] = useState(null);
  const card = useRef(null);
  const pending = useRef(false);
  const pointer = useRef(null);
  const heading = useRef(null);
  const profile = items?.[position];

  async function swipe(action) {
    if (!profile || pending.current || match) return;
    pending.current = true;
    setBusy(true);
    setSaveError('');

    try {
      const result = await request('/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id, action }),
      });

      const element = card.current;
      if (element && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const direction = action === 'like' ? 1 : -1;
        const animation = element.animate([
          { transform: getComputedStyle(element).transform, opacity: 1 },
          { transform: `translateX(${direction * 150}%) rotate(${direction * 14}deg)`, opacity: 0 },
        ], { duration: 230, easing: 'ease-in', fill: 'forwards' });
        await animation.finished.catch(() => {});
      }

      setPosition((index) => index + 1);
      setNotice(action === 'like' ? `Liked ${profile.name}.` : `Passed on ${profile.name}.`);
      setMatch(result.match);
    } catch (error) {
      if (error.status === 409) {
        setPosition(0);
        setNotice('This profile was already swiped. The feed was refreshed.');
        reload();
      } else {
        setSaveError('Couldn’t save that swipe. Try the same action again.');
      }
    } finally {
      setOffset(0);
      pending.current = false;
      setBusy(false);
    }
  }

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0 || pending.current) return;
    pointer.current = { id: event.pointerId, start: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function moveDrag(event) {
    if (pointer.current?.id === event.pointerId) setOffset(event.clientX - pointer.current.start);
  }

  function endDrag(event, cancelled = false) {
    if (pointer.current?.id !== event.pointerId) return;
    const delta = event.clientX - pointer.current.start;
    pointer.current = null;
    setDragging(false);
    if (!cancelled && Math.abs(delta) >= 65) {
      setOffset(delta);
      void swipe(delta > 0 ? 'like' : 'pass');
    } else {
      setOffset(0);
    }
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
          <article key={profile.id} ref={card} className={`profile-card${dragging ? ' dragging' : ''}`}
            style={{ transform: `translateX(${offset}px) rotate(${offset / 28}deg)` }}
            onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
            onPointerCancel={(event) => endDrag(event, true)} onLostPointerCapture={(event) => endDrag(event, true)}>
            <div className="portrait">
              <img src={profile.photo} alt={`Portrait of ${profile.name}`} draggable={false} />
              {Math.abs(offset) > 14 && (
                <span className={`swipe-cue ${offset > 0 ? 'like' : 'pass'}`} aria-hidden="true">{offset > 0 ? 'Like' : 'Pass'}</span>
              )}
              <div className="identity">
                <h2 ref={heading} tabIndex={-1}>{profile.name}, {profile.age}</h2>
                <p>{profile.city}</p>
              </div>
            </div>
            <div className="profile-details">
              <p>{profile.bio}</p>
              <ul aria-label="Interests">{profile.interests.map((interest) => <li key={interest}>{interest}</li>)}</ul>
            </div>
          </article>
          <div className="swipe-actions" aria-busy={busy}>
            <button className="button secondary" aria-disabled={busy} onClick={() => swipe('pass')}><span aria-hidden="true">×</span> Pass</button>
            <button className="button primary" aria-disabled={busy} onClick={() => swipe('like')}><span aria-hidden="true">♥</span> Like</button>
          </div>
          {saveError && <p className="save-error" role="alert">{saveError}</p>}
        </>
      )}
      {match && <MatchDialog profile={match} onClose={closeMatch} />}
    </section>
  );
}
