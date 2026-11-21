import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Boxes, Check, Eye, EyeOff, Leaf, PackageCheck, Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <aside className="login-brand-panel">
          <Link to="/" className="login-brand" aria-label="Batloung Farm home">
            <span className="brand-mark brand-mark-light"><Leaf size={22} strokeWidth={2.2} /></span>
            <span className="brand-name">Batloung Farm</span>
          </Link>
          <div className="login-brand-copy">
            <span className="login-kicker">Distribution management</span>
            <h1>Fresh Produce Distribution, Simplified.</h1>
            <p>Bring suppliers, stock, vendors, sales and payments together in one clear workspace.</p>
          </div>
          <div className="login-visual" aria-hidden="true">
            <div className="login-visual-line login-visual-line-one" />
            <div className="login-visual-line login-visual-line-two" />
            <div className="login-visual-node login-node-source"><Truck size={20} /></div>
            <div className="login-visual-node login-node-stock"><Boxes size={22} /></div>
            <div className="login-visual-node login-node-delivery"><PackageCheck size={19} /></div>
            <div className="login-visual-caption">
              <span className="login-visual-caption-icon"><Check size={14} /></span>
              <span><strong>Every step, in sync</strong><small>From incoming stock to vendor sales</small></span>
            </div>
          </div>
          <span className="login-brand-footer">Batloung Farm · Maseru, Lesotho</span>
        </aside>

        <section className="login-form-panel">
          <Link to="/" className="login-back"><ArrowLeft size={16} /> Back to home</Link>
          <div className="login-form-content">
            <span className="login-form-icon"><Leaf size={19} /></span>
            <h2>Welcome Back</h2>
            <p className="login-sub">Sign in to manage the distribution system.</p>

            <Alert type="error" message={error} onClose={() => setError('')} />

            <form onSubmit={handleSubmit} className="login-form">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                required
              />

              <label htmlFor="login-password">Password</label>
              <div className="password-wrap">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPw((visible) => !visible)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign In'}
                {!submitting && <ArrowRight size={17} />}
              </button>
            </form>

            <p className="login-secure-note"><span /> Your account is protected and secure</p>
          </div>
        </section>
      </section>
    </main>
  );
}
