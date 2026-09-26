import { ArrowRight, CheckCircle2, MapPin, Radio, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Logo } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/api';

export function AuthPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: 'customer@routeflow.dev', phone: '', password: 'Password123!' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-story__content"><span className="pill"><Radio size={14} /> LIVE LOGISTICS</span><h1>Every delivery.<br /><em>Visible.</em></h1><p>Move orders with confidence using precise tracking, clear handoffs, and one operational view.</p><div className="feature-row"><span><MapPin />Real-time location</span><span><ShieldCheck />Secure by role</span><span><CheckCircle2 />Verified milestones</span></div></div>
        <div className="route-art"><span className="route-art__a" /><span className="route-art__line" /><span className="route-art__truck">➤</span><span className="route-art__b" /></div>
      </section>
      <section className="auth-panel">
        <div className="auth-box"><div><span className="eyebrow">WELCOME TO ROUTEFLOW</span><h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2><p>{mode === 'login' ? 'Enter your details to manage deliveries.' : 'Start sending and tracking in minutes.'}</p></div>
          <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button></div>
          <form onSubmit={submit}>
            {mode === 'register' && <><label>Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Priya Sharma" /></label><label>Phone<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" /></label></>}
            <label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" /></label>
            <label>Password<input type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={18} /></button>
          </form>
          <div className="demo-note"><strong>Demo access</strong><span>customer@routeflow.dev · agent@routeflow.dev · admin@routeflow.dev</span><span>Password: Password123!</span></div>
        </div>
      </section>
    </main>
  );
}
