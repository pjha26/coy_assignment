import Link from 'next/link';
import { Navigation } from './navigation.jsx';
import './styles.css';

export const metadata = {
  title: 'Coy Discover',
  description: 'A standalone swipe and match demo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="wordmark" aria-label="Coy home">coy<span>.</span></Link>
            <Navigation />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
