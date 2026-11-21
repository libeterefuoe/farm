import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Apple, Users, Boxes, ShoppingCart, Sprout,
  ClipboardList, PlusCircle, Receipt, BarChart3, LogOut, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const groups = [
  {
    label: null,
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/suppliers', label: 'Suppliers', icon: Truck },
      { to: '/fruits',    label: 'Fruits',    icon: Apple },
      { to: '/vendors',   label: 'Vendors',   icon: Users }
    ]
  },
  {
    label: 'Stock',
    items: [
      { to: '/stock', label: 'Stock Levels', icon: Boxes }
    ]
  },
  {
    label: 'Operations',
    items: [
      { to: '/purchases/new', label: 'New Purchase', icon: PlusCircle },
      { to: '/purchases',     label: 'Purchases',    icon: ClipboardList },
      { to: '/sales/new',     label: 'New Sale',     icon: ShoppingCart },
      { to: '/sales',         label: 'Sales',        icon: Receipt }
    ]
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3 }
    ]
  }
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo"><Sprout size={19} /></span>
            <span className="sidebar-brand-name">Batloung Farm</span>
          </div>
          <button className="sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {groups.map((group, gi) => (
            <div key={gi} className="sidebar-group">
              {group.label && <div className="sidebar-group-label">{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                    onClick={onClose}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}