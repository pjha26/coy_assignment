'use client';

import Link from 'next/link';
import { useCollection } from '../api-client.js';

export default function MatchesPage() {
  const { items, error, reload } = useCollection('/matches', 'matches');
  if (error) return <div className="state"><h2>Couldn’t load matches</h2><button className="button primary" onClick={reload}>Try again</button></div>;
  if (!items) return <p className="state" role="status">Loading matches…</p>;
  if (!items.length) return (
    <div className="state">
      <h2>No matches yet</h2>
      <p>You’ll see someone here when you like each other.</p>
      <Link className="button primary" href="/discover">Back to profiles</Link>
    </div>
  );

  return (
    <ul className="matches-list" aria-label="Mutual matches">
      {items.map((profile) => (
        <li key={profile.id}>
          <img src={profile.photo} alt="" />
          <div><h2>{profile.name}, {profile.age}</h2><p>{profile.city}</p></div>
          <span aria-hidden="true">♥</span>
        </li>
      ))}
    </ul>
  );
}
