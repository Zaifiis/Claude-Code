import { useEffect, useState } from 'react';
import OrderPage from './pages/OrderPage.jsx';
import KitchenPage from './pages/KitchenPage.jsx';

// Tiny hash router — keeps the build dependency-free.
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const on = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const isKitchen = hash.startsWith('#/kitchen');

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="mark">ذائقہ لائن</span>
          <span className="en">ZAIQA LINE</span>
          <span className="tag">Urdu voice ordering · pickup</span>
        </div>
        <nav className="nav">
          <a href="#/" className={!isKitchen ? 'active' : ''}>Order</a>
          <a href="#/kitchen" className={isKitchen ? 'active' : ''}>Kitchen</a>
        </nav>
      </header>
      {isKitchen ? <KitchenPage /> : <OrderPage />}
    </>
  );
}
