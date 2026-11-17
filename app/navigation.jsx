'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let saved;
    try { saved = localStorage.getItem('coy-theme'); } catch {}
    const enabled = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = enabled ? 'dark' : 'paper';
    setDark(enabled);
  }, []);

  function toggle() {
    const next = dark ? 'paper' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('coy-theme', next); } catch {}
    setDark(!dark);
  }

  return <button className="theme-switch" onClick={toggle} aria-pressed={dark} aria-label="Darkroom theme" title="Toggle darkroom theme"><span aria-hidden="true" /></button>;
}

export function Navigation({ discover = false }) {
  const pathname = usePathname();
  const links = discover
    ? [['/discover', 'Profiles'], ['/discover/matches', 'Matches']]
    : [['/', 'Home'], ['/discover', 'Discover']];

  return (
    <nav className={discover ? 'view-nav' : 'site-nav'} aria-label={discover ? 'Discover views' : 'Main navigation'}>
      {links.map(([href, label]) => (
        <Link key={href} href={href} aria-current={
          pathname === href || (!discover && href === '/discover' && pathname.startsWith('/discover/'))
            ? 'page' : undefined
        }>{label}</Link>
      ))}
    </nav>
  );
}
