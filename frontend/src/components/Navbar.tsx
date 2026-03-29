import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS: Record<string, string> = {
  All: '🗂️', Computers: '💻', Networking: '🌐', Storage: '💾',
  Peripherals: '🖥️', 'Mobile & Tablets': '📱', Others: '📦',
};

interface NavbarProps {
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  categoryCounts?: Record<string, number>;
}

export default function Navbar({ categories, selectedCategory, onSelectCategory, categoryCounts }: NavbarProps) {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
    setMenuOpen(false);
  }

  const hasCats = categories && categories.length > 0;

  return (
    <>
      {/* ── Main bar ── */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.brand}>🔨 AuctionHub</Link>

        {/* Desktop: category chips in the middle */}
        {hasCats && (
          <div style={styles.desktopCats} className="nav-desktop-cats">
            {categories!.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onSelectCategory?.(cat)}
                  style={{
                    ...styles.chip,
                    background: active ? '#C5D96A' : 'transparent',
                    color: active ? '#2E3A10' : '#C8D89A',
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                  {categoryCounts && (
                    <span style={{
                      ...styles.chipBadge,
                      background: active ? 'rgba(46,58,16,0.15)' : 'rgba(255,255,255,0.12)',
                      color: active ? '#2E3A10' : '#C8D89A',
                    }}>
                      {categoryCounts[cat] ?? 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Desktop: auth links */}
        <div style={styles.desktopAuth} className="nav-desktop-auth">
          {username ? (
            <>
              <Link to="/create" style={styles.link}>+ List Item</Link>
              <span style={styles.user}>Hi, {username}</span>
              <button onClick={handleLogout} style={styles.btn}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.btn2}>Register</Link>
            </>
          )}
        </div>

        {/* Mobile: burger button */}
        <button
          style={styles.burger}
          className="nav-burger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* ── Mobile dropdown menu ── */}
      {menuOpen && (
        <div style={styles.drawer}>
          {/* Auth section */}
          <div style={styles.drawerSection}>
            {username ? (
              <>
                <div style={styles.drawerUser}>👤 {username}</div>
                <Link to="/create" style={styles.drawerLink} onClick={() => setMenuOpen(false)}>+ List an Item</Link>
                <button onClick={handleLogout} style={styles.drawerLogout}>Logout</button>
              </>
            ) : (
              <div style={styles.drawerAuthRow}>
                <Link to="/login" style={styles.drawerAuthBtn} onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" style={{ ...styles.drawerAuthBtn, background: '#C5D96A', color: '#2E3A10' }} onClick={() => setMenuOpen(false)}>Register</Link>
              </div>
            )}
          </div>

          {/* Category section */}
          {hasCats && (
            <div style={styles.drawerSection}>
              <div style={styles.drawerSectionLabel}>Browse by Category</div>
              <div style={styles.drawerCats}>
                {categories!.map(cat => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => { onSelectCategory?.(cat); setMenuOpen(false); }}
                      style={{
                        ...styles.drawerCatBtn,
                        background: active ? '#3B4A1E' : '#F4F5F0',
                        color: active ? '#C5D96A' : '#3B4A1E',
                        border: active ? '2px solid #3B4A1E' : '2px solid #E0E4D4',
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[cat]}</span>
                      <span style={{ flex: 1, textAlign: 'left' }}>{cat}</span>
                      {categoryCounts && (
                        <span style={{
                          ...styles.drawerBadge,
                          background: active ? 'rgba(197,217,106,0.2)' : '#E4EAD0',
                          color: active ? '#C5D96A' : '#6B8728',
                        }}>
                          {categoryCounts[cat] ?? 0}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {menuOpen && <div style={styles.backdrop} onClick={() => setMenuOpen(false)} />}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', height: 56, background: '#3B4A1E',
    position: 'sticky', top: 0, zIndex: 200,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    gap: 8,
  },
  brand: { color: '#C5D96A', fontWeight: 700, fontSize: 18, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 },

  /* Desktop chips */
  desktopCats: {
    display: 'flex', alignItems: 'center', gap: 2, flex: 1,
    overflowX: 'auto', scrollbarWidth: 'none',
    padding: '0 8px',
  },
  chip: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', borderRadius: 100, border: 'none',
    cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap',
    transition: 'all .15s', flexShrink: 0,
  },
  chipBadge: {
    fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
  },

  /* Desktop auth — .nav-desktop-auth hides on mobile via CSS */
  desktopAuth: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  link: { color: '#D4DCA8', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' },
  user: { color: '#A8B878', fontSize: 13, whiteSpace: 'nowrap' },
  btn: { background: 'transparent', border: '1px solid #C5D96A', color: '#C5D96A', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 13 },
  btn2: { background: '#C5D96A', color: '#2E3A10', padding: '5px 12px', borderRadius: 4, textDecoration: 'none', fontSize: 13, fontWeight: 600 },

  /* Burger — visibility controlled by CSS class .nav-burger */
  burger: { background: 'transparent', border: 'none', color: '#C5D96A', fontSize: 22, cursor: 'pointer', padding: '4px 6px', lineHeight: 1 },

  /* Drawer */
  drawer: {
    position: 'fixed', top: 56, left: 0, right: 0,
    background: '#fff', zIndex: 199, overflowY: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    maxHeight: 'calc(100vh - 56px)',
  },
  backdrop: { position: 'fixed', inset: 0, top: 56, zIndex: 198, background: 'rgba(0,0,0,0.3)' },
  drawerSection: { padding: '16px', borderBottom: '1px solid #EEF0E8' },
  drawerSectionLabel: { fontSize: 11, fontWeight: 700, color: '#AAB890', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  drawerUser: { fontWeight: 600, color: '#3B4A1E', fontSize: 15, marginBottom: 12 },
  drawerLink: { display: 'block', color: '#6B8728', fontWeight: 600, fontSize: 15, textDecoration: 'none', marginBottom: 10 },
  drawerLogout: { background: 'transparent', border: '1px solid #D8DDCA', color: '#888', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 14, width: '100%' },
  drawerAuthRow: { display: 'flex', gap: 10 },
  drawerAuthBtn: { flex: 1, textAlign: 'center', padding: '10px', borderRadius: 6, border: '1px solid #D8DDCA', color: '#3B4A1E', textDecoration: 'none', fontWeight: 600, fontSize: 15 },
  drawerCats: { display: 'flex', flexDirection: 'column', gap: 8 },
  drawerCatBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 15, transition: 'all .15s' },
  drawerBadge: { fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 100 },
};
