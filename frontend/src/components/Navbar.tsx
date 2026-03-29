import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>🔨 AuctionHub</Link>
      <div className="nav-links">
        {username ? (
          <>
            <Link to="/create" style={styles.link}>+ List Item</Link>
            <span style={styles.user}>Hi, {username}</span>
            <button onClick={handleLogout} style={styles.btn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 56, background: '#3B4A1E', color: '#fff',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  },
  brand: { color: '#C5D96A', fontWeight: 700, fontSize: 18, textDecoration: 'none', whiteSpace: 'nowrap' },
  link: { color: '#D4DCA8', textDecoration: 'none', fontSize: 14 },
  user: { color: '#A8B878', fontSize: 13, whiteSpace: 'nowrap' },
  btn: {
    background: 'transparent', border: '1px solid #C5D96A', color: '#C5D96A',
    padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 13,
  },
};
