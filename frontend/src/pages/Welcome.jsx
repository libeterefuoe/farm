import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Boxes, Check, ChevronRight, ClipboardList,
  CreditCard, Leaf, PackageCheck, ShoppingCart, Truck, Users
} from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Suppliers',
    text: 'Keep supplier contacts, locations and purchasing relationships organized.'
  },
  {
    icon: Boxes,
    title: 'Stock by packaging size',
    text: 'See available quantities and reorder levels for every fruit and pack size.'
  },
  {
    icon: Users,
    title: 'Vendors',
    text: 'Manage vendor details and keep outstanding balances in view.'
  },
  {
    icon: ClipboardList,
    title: 'Purchases',
    text: 'Record supplier deliveries and track the cost of each purchase.'
  },
  {
    icon: ShoppingCart,
    title: 'Sales',
    text: 'Create multi-item sales with live stock availability and clear totals.'
  },
  {
    icon: BarChart3,
    title: 'Payments and reports',
    text: 'Record payments and review revenue, sales, stock and balances.'
  }
];

const steps = [
  { number: '01', title: 'Buy from suppliers', icon: Truck },
  { number: '02', title: 'Manage stock', icon: Boxes },
  { number: '03', title: 'Sell to vendors', icon: ShoppingCart },
  { number: '04', title: 'Receive payments', icon: CreditCard }
];

export default function Welcome() {
  return (
    <div className="welcome">
      <header className="welcome-nav">
        <Link to="/" className="welcome-brand" aria-label="Batloung Farm home">
          <span className="brand-mark"><Leaf size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">Batloung Farm</span>
        </Link>
      </header>

      <main>
        <section className="welcome-hero">
          <div className="welcome-hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> Distribution management</span>
            <h1>Fresh Produce Distribution, <span>Simplified.</span></h1>
            <p>
              One clear view of your fruit suppliers, stock, vendors, sales and payments.
              Keep daily distribution moving with tools built for your business.
            </p>
            <div className="welcome-hero-actions">
              <Link to="/login" className="btn btn-primary welcome-cta">
                Admin Login <ArrowRight size={17} />
              </Link>
              <a className="welcome-secondary-link" href="#how-it-works">
                See how it works <ChevronRight size={16} />
              </a>
            </div>
            <div className="welcome-trust">
              <span className="welcome-trust-icon"><Check size={15} /></span>
              <span>Purchases, inventory and sales in one place</span>
            </div>
          </div>

          <div className="welcome-visual" aria-label="Illustration of a produce distribution dashboard">
            <div className="visual-orbit visual-orbit-one" />
            <div className="visual-orbit visual-orbit-two" />
            <div className="visual-leaf visual-leaf-one"><Leaf size={30} /></div>
            <div className="visual-leaf visual-leaf-two"><Leaf size={22} /></div>
            <div className="visual-card">
              <div className="visual-card-top">
                <div>
                  <span className="visual-card-label">Inventory overview</span>
                  <strong>Stock at a glance</strong>
                </div>
                <span className="visual-card-icon"><Boxes size={18} /></span>
              </div>
              <div className="visual-stock-row">
                <span className="stock-item-mark stock-mark-green"><Leaf size={15} /></span>
                <span className="visual-stock-name"><strong>Fresh produce</strong><small>Across all pack sizes</small></span>
                <span className="stock-status"><span /> In stock</span>
              </div>
              <div className="visual-stock-row">
                <span className="stock-item-mark stock-mark-sage"><PackageCheck size={15} /></span>
                <span className="visual-stock-name"><strong>Recent purchase</strong><small>Supplier delivery recorded</small></span>
                <span className="stock-row-check"><Check size={15} /></span>
              </div>
              <div className="visual-card-footer">
                <span className="visual-footer-icon"><BarChart3 size={16} /></span>
                <span>Purchases and sales, connected</span>
                <ArrowRight size={15} />
              </div>
            </div>
            <div className="visual-note">
              <span className="visual-note-icon"><Truck size={16} /></span>
              <span><strong>From farm to vendor</strong><small>One organized workflow</small></span>
            </div>
          </div>
        </section>

        <section className="welcome-features section-wrap" id="features">
          <div className="section-heading">
            <span className="eyebrow">The essentials, connected</span>
            <h2>Everything your operation needs</h2>
            <p>Practical tools for each step of your produce distribution workflow.</p>
          </div>
          <div className="welcome-features-grid">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="welcome-feature-card">
                <div className="welcome-feature-icon"><Icon size={20} strokeWidth={1.9} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="welcome-how" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">A straightforward workflow</span>
            <h2>From supplier to settlement</h2>
            <p>Follow your operation from incoming stock through to payment.</p>
          </div>
          <div className="welcome-how-steps">
            {steps.map(({ number, title, icon: Icon }, index) => (
              <div className="welcome-step" key={number}>
                <div className="welcome-step-top">
                  <span className="welcome-step-icon"><Icon size={19} /></span>
                  <span className="welcome-step-number">{number}</span>
                </div>
                <h3>{title}</h3>
                {index < steps.length - 1 && <span className="welcome-step-connector" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        © {new Date().getFullYear()} Batloung Farm
      </footer>
    </div>
  );
}
