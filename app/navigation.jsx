'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
