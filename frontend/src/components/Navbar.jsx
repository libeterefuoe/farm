import { NavLink } from 'react-router-dom';

// Top navigation. Active link gets the "active" class from styles.css.
const links = [
  { to: '/',              label: 'Dashboard' },
  { to: '/suppliers',     label: 'Suppliers' },
  { to: '/fruits',        label: 'Fruits' },
  { to: '/stock',         label: 'Stock' },
  { to: '/vendors',       label: 'Vendors' },
  { to: '/purchases/new', label: 'New Purchase' },
  { to: '/sales/new',     label: 'New Sale' },
  { to: '/sales',         label: 'Sales' },
  { to: '/reports',       label: 'Reports' }
];

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo"></span>
        <span>Batloung Farm</span>
      </div>
      <nav className="navbar-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}