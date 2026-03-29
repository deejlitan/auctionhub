import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiLogin(username, password);
      login(data.token, data.username, data.userId);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} className="auth-card">
        <div style={styles.logoArea}>🔨</div>
        <h2 style={styles.title}>Sign In</h2>
        <p style={styles.subtitle}>Welcome back to AuctionHub</p>
        {error && <p style={styles.error}>{error}</p>}
        <label style={styles.label}>Username</label>
        <input style={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button style={styles.btn} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        <p style={styles.footer}>No account? <Link to="/register" style={styles.footerLink}>Register</Link></p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF0E8', padding: '16px' },
  logoArea: { fontSize: 36, textAlign: 'center', marginBottom: 4 },
  title: { margin: 0, fontSize: 22, textAlign: 'center', color: '#2E3A10' },
  subtitle: { margin: '0 0 8px', fontSize: 13, textAlign: 'center', color: '#888' },
  label: { fontSize: 13, fontWeight: 600, color: '#4A5A20' },
  input: { padding: '9px 12px', border: '1px solid #C5D48A', borderRadius: 4, fontSize: 14, outline: 'none', background: '#FAFFF4' },
  btn: { marginTop: 8, padding: '10px', background: '#6B8728', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#c0392b', fontSize: 13, margin: 0, background: '#fdf0f0', padding: '6px 10px', borderRadius: 4 },
  footer: { fontSize: 13, textAlign: 'center', margin: '4px 0 0', color: '#666' },
  footerLink: { color: '#6B8728', fontWeight: 600 },
};
