import { Link } from 'react-router-dom';
import {
  Truck, Boxes, Users, ShoppingCart, Receipt, BarChart3, ArrowRight
} from 'lucide-react';

const features = [
  { icon: Truck,       title: 'Suppliers',                 text: 'Track every South African supplier in one place.' },
  { icon: Boxes,       title: 'Stock by packaging size',   text: 'Small, medium and large tracked separately, per fruit.' },
  { icon: Users,       title: 'Vendors',                   text: 'Street vendors and retailers with live outstanding balances.' },
  { icon: ShoppingCart,title: 'Purchases',                 text: 'Record multi-item purchases and increase stock atomically.' },
  { icon: Receipt,     title: 'Sales',                     text: 'Multi-item sales with automatic totals and stock validation.' },
  { icon: BarChart3,   title: 'Payments & Reports',        text: 'Cash, mobile money and credit payments plus 5 reports.' }
];

export default function Welcome() {
  return (
    <div className="welcome">
      <header className="welcome-nav">
        <div className="welcome-brand">
          <span>🍎</span>
          <strong>Batloung Farm</strong>
        </div>
        <Link to="/login" className="btn btn-primary">Admin Login</Link>
      </header>

      <section className="welcome-hero">
        <div className="welcome-hero-text">
          <h1>Fresh produce distribution, simplified.</h1>
          <p>
            Batloung Farm buys fruit from South African suppliers and sells it to
            street vendors and small retailers across Maseru. Manage every supplier,
            box, sale and payment in one clean dashboard.
          </p>
          <Link to="/login" className="btn btn-primary welcome-cta">
            Admin Login <ArrowRight size={16} />
          </Link>
        </div>
        <div className="welcome-hero-art" aria-hidden="true">
          <div className="fruit-bubble fruit-1">🍎</div>
          <div className="fruit-bubble fruit-2">🍌</div>
          <div className="fruit-bubble fruit-3">🍊</div>
          <div className="fruit-bubble fruit-4">🥭</div>
          <div className="fruit-bubble fruit-5">🍇</div>
        </div>
      </section>

      <section className="welcome-features">
        <h2>Everything you need to run the farm</h2>
        <div className="welcome-features-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="welcome-feature-card">
              <div className="welcome-feature-icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="welcome-how">
        <h2>How it works</h2>
        <div className="welcome-how-steps">
          <div className="welcome-step"><span>1</span><p>Buy from suppliers</p></div>
          <div className="welcome-arrow">→</div>
          <div className="welcome-step"><span>2</span><p>Stock by packaging size</p></div>
          <div className="welcome-arrow">→</div>
          <div className="welcome-step"><span>3</span><p>Sell to vendors</p></div>
          <div className="welcome-arrow">→</div>
          <div className="welcome-step"><span>4</span><p>Get paid</p></div>
        </div>
      </section>

      <footer className="welcome-footer">
        Batloung Farm · Maseru, Lesotho 
      </footer>
    </div>
  );
}