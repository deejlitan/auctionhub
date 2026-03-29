import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getItems, type AuctionItem } from '../api/items';
import CountdownTimer from '../components/CountdownTimer';

const CATEGORIES = ['All', 'Computers', 'Networking', 'Storage', 'Peripherals', 'Mobile & Tablets', 'Others'];

const CATEGORY_ICONS: Record<string, string> = {
  All: '🗂️',
  Computers: '💻',
  Networking: '🌐',
  Storage: '💾',
  Peripherals: '🖥️',
  'Mobile & Tablets': '📱',
  Others: '📦',
};

export default function AuctionList() {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    getItems()
      .then(({ data }) => setItems(data))
      .catch(() => setError('Failed to load auctions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedCategory === 'All'
    ? items
    : items.filter(i => i.category === selectedCategory);

  const active = filtered.filter(i => i.isActive);
  const ended = filtered.filter(i => !i.isActive);

  // Count per category for badges
  const countByCategory = (cat: string) =>
    cat === 'All' ? items.length : items.filter(i => i.category === cat).length;

  if (loading) return <p style={styles.msg}>Loading auctions…</p>;
  if (error) return <p style={{ ...styles.msg, color: '#c0392b' }}>{error}</p>;

  return (
    <div style={styles.page}>
      <div style={styles.inner}>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Categories</div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                ...styles.catBtn,
                background: selectedCategory === cat ? '#6B8728' : 'transparent',
                color: selectedCategory === cat ? '#fff' : '#3B4A1E',
                fontWeight: selectedCategory === cat ? 700 : 400,
              }}
            >
              <span>{CATEGORY_ICONS[cat]} {cat}</span>
              <span style={{
                ...styles.catCount,
                background: selectedCategory === cat ? 'rgba(255,255,255,0.25)' : '#E4EAD0',
                color: selectedCategory === cat ? '#fff' : '#6B8728',
              }}>
                {countByCategory(cat)}
              </span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <div style={styles.main}>
          <div style={styles.header}>
            <h1 style={styles.heading}>
              {selectedCategory === 'All' ? 'All Auctions' : `${CATEGORY_ICONS[selectedCategory]} ${selectedCategory}`}
              <span style={styles.resultCount}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</span>
            </h1>
            <Link to="/create" style={styles.createBtn}>+ List an Item</Link>
          </div>

          {active.length === 0 && ended.length === 0 && (
            <p style={styles.empty}>No listings in this category yet.</p>
          )}

          {active.length > 0 && (
            <div style={styles.grid}>
              {active.map(item => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {ended.length > 0 && (
            <>
              <h2 style={styles.sectionTitle}>Ended</h2>
              <div style={styles.grid}>
                {ended.map(item => <ItemCard key={item.id} item={item} ended />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, ended = false }: { item: AuctionItem; ended?: boolean }) {
  const isUniform = item.quantity > 1;
  return (
    <Link to={`/items/${item.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ ...styles.card, opacity: ended ? 0.65 : 1 }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} style={styles.img} />
          : <div style={styles.imgPlaceholder}>🔨</div>
        }
        <div style={styles.cardTop}>
          <span style={styles.categoryTag}>{CATEGORY_ICONS[item.category] ?? '📦'} {item.category}</span>
          {isUniform && <span style={styles.uniformTag}>⚖️ Uniform</span>}
        </div>
        <div style={styles.cardBody}>
          <h3 style={styles.cardTitle}>{item.title}</h3>
          <p style={styles.cardDesc}>{item.description.slice(0, 80)}{item.description.length > 80 ? '…' : ''}</p>
          <div style={styles.cardFooter}>
            <div>
              <div style={styles.bidLabel}>{isUniform ? 'Clearing Price' : 'Current Bid'}</div>
              <div style={styles.bidAmount}>₱{item.currentBid.toFixed(2)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.bidLabel}>Time Left</div>
              <CountdownTimer endTime={item.endTime} />
            </div>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.qtyTag}>📦 {item.quantity} unit{item.quantity !== 1 ? 's' : ''}</span>
            {!isUniform && item.currentBidderName && (
              <span style={styles.bidder}>Highest: {item.currentBidderName}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { background: '#F4F5F0', minHeight: '100vh', padding: '24px 16px' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'flex-start' },

  // Sidebar
  sidebar: { width: 200, flexShrink: 0, background: '#fff', borderRadius: 8, border: '1px solid #D8DDCA', padding: 12, position: 'sticky', top: 72 },
  sidebarTitle: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, padding: '0 8px' },
  catBtn: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 2, textAlign: 'left' as const, transition: 'background .15s' },
  catCount: { fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 },

  // Main
  main: { flex: 1, minWidth: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { margin: 0, fontSize: 22, color: '#3B4A1E', display: 'flex', alignItems: 'center', gap: 10 },
  resultCount: { fontSize: 13, color: '#999', fontWeight: 400 },
  createBtn: { background: '#6B8728', color: '#fff', padding: '8px 18px', borderRadius: 4, textDecoration: 'none', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' as const },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 },
  sectionTitle: { margin: '28px 0 14px', color: '#7A7A7A', fontSize: 16 },
  empty: { textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 15 },

  // Cards
  card: { border: '1px solid #D8DDCA', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.07)', cursor: 'pointer' },
  img: { width: '100%', height: 160, objectFit: 'cover' },
  imgPlaceholder: { height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, background: '#EEF0E8' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', borderBottom: '1px solid #F0F0EC' },
  categoryTag: { fontSize: 11, color: '#6B8728', fontWeight: 600 },
  uniformTag: { fontSize: 11, background: '#3B4A1E', color: '#C5D96A', padding: '2px 6px', borderRadius: 4, fontWeight: 600 },
  cardBody: { padding: 12 },
  cardTitle: { margin: '0 0 5px', fontSize: 14, fontWeight: 600, color: '#2E3A10' },
  cardDesc: { margin: '0 0 10px', fontSize: 12, color: '#6B6B6B' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  bidLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  bidAmount: { fontWeight: 700, fontSize: 16, color: '#6B8728' },
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  qtyTag: { fontSize: 11, color: '#6B8728', fontWeight: 600 },
  bidder: { fontSize: 11, color: '#888' },
  msg: { textAlign: 'center', padding: '60px 0', color: '#888' },
};
