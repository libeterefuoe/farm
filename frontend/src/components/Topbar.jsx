import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/dashboard':       'Dashboard',
  '/suppliers':       'Suppliers',
  '/fruits':          'Fruits',
  '/vendors':         'Vendors',
  '/stock':           'Stock Levels',
  '/purchases':       'Purchases',
  '/purchases/new':   'New Purchase',
  '/sales':           'Sales',
  '/sales/new':       'New Sale',
  '/reports':         'Reports'
};

function initials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation();
  const { admin } = useAuth();
  const title = titles[location.pathname] || 'Batloung Farm';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <div className="topbar-avatar">{initials(admin?.username)}</div>
        <span className="topbar-name">{admin?.username || 'Admin'}</span>
      </div>
    </header>
  );
}