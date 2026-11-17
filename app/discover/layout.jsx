import { Navigation } from '../navigation.jsx';

export default function DiscoverLayout({ children }) {
  return (
    <main className="discover">
      <div className="discover-heading">
        <h1>Discover<span>.</span></h1>
        <p>See who you might click with.</p>
      </div>
      <Navigation discover />
      {children}
    </main>
  );
}
