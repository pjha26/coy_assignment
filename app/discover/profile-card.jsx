'use client';

import { useRef, useState } from 'react';

const SWIPE_THRESHOLD = 65;

export function ProfileCard({ profile, headingRef, onSave, onAdvance }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(null);
  const card = useRef(null);
  const pending = useRef(false);
  const pointer = useRef(null);

  async function swipe(action) {
    if (pending.current || pointer.current) return;
    pending.current = true;
    setSaving(action);

    try {
      const result = await onSave(action);
      if (!result || !card.current) return;

      const element = card.current;
      if (element.animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const direction = action === 'like' ? 1 : -1;
        const animation = element.animate([
          { transform: getComputedStyle(element).transform, opacity: 1 },
          { transform: `translateX(${direction * 150}%) rotate(${direction * 14}deg)`, opacity: 0 },
        ], { duration: 230, easing: 'ease-in', fill: 'forwards' });
        await animation.finished.catch(() => {});
      }
      if (card.current) onAdvance(action, result);
    } finally {
      setOffset(0);
      setSaving(null);
      pending.current = false;
    }
  }

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0 || pending.current || pointer.current) return;
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
    if (cancelled || Math.abs(delta) < SWIPE_THRESHOLD) {
      setOffset(0);
      return;
    }
    setOffset(delta);
    void swipe(delta > 0 ? 'like' : 'pass');
  }

  const cue = saving ?? (Math.abs(offset) > 14 ? (offset > 0 ? 'like' : 'pass') : null);

  return (
    <>
      <article key={profile.id} ref={card} className={`profile-card${dragging ? ' dragging' : ''}`}
        style={{ transform: `translateX(${offset}px) rotate(${offset / 28}deg)` }}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
        onPointerCancel={(event) => endDrag(event, true)} onLostPointerCapture={(event) => endDrag(event, true)}>
        <div className="portrait">
          <img src={profile.photo} alt={`Portrait of ${profile.name}`} draggable={false} />
          {cue && <span className={`swipe-cue ${cue}`} aria-hidden="true">{cue}</span>}
          <div className="identity">
            <h2 ref={headingRef} tabIndex={-1}>{profile.name}, {profile.age}</h2>
            <p>{profile.city}</p>
          </div>
        </div>
        <div className="profile-details">
          <p>{profile.bio}</p>
          <ul aria-label="Interests">{profile.interests.map((interest) => <li key={interest}>{interest}</li>)}</ul>
        </div>
      </article>
      <div className="swipe-actions" aria-busy={Boolean(saving)}>
        <button className="button secondary" aria-disabled={Boolean(saving)} onClick={() => swipe('pass')}><span aria-hidden="true">×</span> Pass</button>
        <button className="button primary" aria-disabled={Boolean(saving)} onClick={() => swipe('like')}><span aria-hidden="true">♥</span> Like</button>
      </div>
    </>
  );
}
