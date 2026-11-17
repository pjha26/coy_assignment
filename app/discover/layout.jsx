import { Navigation } from '../navigation.jsx';

export default function DiscoverLayout({ children }) {
  return (
    <main className="discover">
      <div className="discover-heading">
        <h1>Disco<em>ver</em><span>.</span></h1>
        <Navigation discover />
      </div>
      {children}
    </main>
  );
}
