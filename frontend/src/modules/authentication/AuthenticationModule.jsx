import { useEffect, useState } from 'react';
import { authRequest } from './authenticationApi.js';
import './authentication.css';

const blankForm = { name: '', email: '', password: '', role: 'reader' };

export default function AuthenticationModule() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(blankForm);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  useEffect(() => {
    const token = localStorage.getItem('articleflow_token');
    if (!token) return;
    authRequest('me', null, token).then(({ user: savedUser }) => setUser(savedUser)).catch(() => localStorage.removeItem('articleflow_token'));
  }, []);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const switchMode = () => { setMode(isRegister ? 'login' : 'register'); setMessage(''); };
  const logout = () => { localStorage.removeItem('articleflow_token'); setUser(null); };
  const submit = async (event) => {
    event.preventDefault(); setMessage(''); setBusy(true);
    try {
      const data = isRegister ? await authRequest('register', form) : await authRequest('login', { email: form.email, password: form.password });
      localStorage.setItem('articleflow_token', data.token); setUser(data.user); setForm(blankForm);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  if (user) return <main className="auth-page font-sans"><section className="welcome-card"><div className="brand-mark">AF</div><p className="eyebrow">YOU'RE SIGNED IN</p><h1>Welcome back, {user.name}.</h1><p>You're signed in as an <strong>{user.role}</strong>. Your next story is waiting to be shared.</p><div className="welcome-actions"><button onClick={logout}>Sign out</button></div></section></main>;

  return <main className="auth-page font-sans"><section className="auth-layout"><aside className="brand-panel"><div className="brand"><span className="brand-mark">AF</span><span>ArticleFlow</span></div><div className="brand-copy"><p className="eyebrow">CREATE · PUBLISH · ENGAGE</p><h1>Turn your ideas into stories that matter.</h1><p>Write beautifully, share knowledge, and invite readers to learn through interactive quizzes.</p></div><div className="feature-list"><span>✦ Publish with confidence</span><span>✦ Build engaging quizzes</span><span>✦ Grow your audience</span></div></aside><section className="form-panel"><div className="form-heading"><p className="eyebrow">{isRegister ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</p><h2>{isRegister ? 'Create your account' : 'Sign in to ArticleFlow'}</h2><p>{isRegister ? 'Choose how you want to experience ArticleFlow.' : 'Continue creating and discovering meaningful content.'}</p></div><form onSubmit={submit}>{isRegister && <div className="two-columns"><label>Display name<input name="name" placeholder="Jane Doe" value={form.name} onChange={update} required minLength="2" /></label><label>Account type<select name="role" value={form.role} onChange={update}><option value="reader">Reader</option><option value="author">Author</option></select></label></div>}<label>Email address<input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={update} required autoComplete="email" /></label><label>Password<input name="password" type="password" placeholder="At least 8 characters" value={form.password} onChange={update} required minLength="8" autoComplete={isRegister ? 'new-password' : 'current-password'} /></label>{message && <p className="error" role="alert">{message}</p>}<button className="submit-button" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <span>→</span></button></form><p className="switch">{isRegister ? 'Already have an account?' : 'New to ArticleFlow?'} <button type="button" className="link" onClick={switchMode}>{isRegister ? 'Sign in' : 'Create an account'}</button></p></section></section></main>;
}
