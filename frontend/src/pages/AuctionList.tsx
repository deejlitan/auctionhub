import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getItems, type AuctionItem } from '../api/items';
import CountdownTimer from '../components/CountdownTimer';
import { useState } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  All: '🗂️', Computers: '💻', Networking: '🌐', Storage: '💾',
  Peripherals: '🖥️', 'Mobile & Tablets': '📱', Others: '📦',
};

interface Props {
  selectedCategory: string;
  onCategoryCounts: (counts: Record<string, number>) => void;
}

export default function AuctionList({ selectedCategory, onCategoryCounts }: Props) {
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getItems()
      .then(({ data }) => {
        setItems(data);
        // compute counts for navbar badges
        const counts: Record<string, number> = { All: data.length };
        for (const item of data) {
          counts[item.category] = (counts[item.category] ?? 0) + 1;
        }
        onCategoryCounts(counts);
      })
      .catch(() => setError('Failed to load auctions.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedCategory === 'All'
    ? items
    : items.filter(i => i.category === selectedCategory);

  const active = filtered.filter(i => i.isActive);
  const ended = filtered.filter(i => !i.isActive);

  if (loading) return <p style={styles.msg}>Loading auctions…</p>;
  if (error) return <p style={{ ...styles.msg, color: '#c0392b' }}>{error}</p>;

  return (
    <div style={styles.page}>
      <div style={styles.listingHeader}>
        <div>
          <h1 style={styles.heading}>
            {selectedCategory === 'All' ? 'All Auctions' : `${CATEGORY_ICONS[selectedCategory] ?? ''} ${selectedCategory}`}
          </h1>
          <p style={styles.subheading}>{filtered.length} listing{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/create" style={styles.createBtn}>+ List an Item</Link>
      </div>

      {active.length === 0 && ended.length === 0 && (
        <p style={styles.empty}>No listings in this category yet.</p>
      )}

      {active.length > 0 && (
        <div className="auction-grid">
          {active.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {ended.length > 0 && (
        <>
          <h2 style={styles.sectionTitle}>Ended</h2>
          <div className="auction-grid">
            {ended.map(item => <ItemCard key={item.id} item={item} ended />)}
          </div>
        </>
      )}
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
              <span style={styles.bidder}>Top: {item.currentBidderName}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '20px 16px', minHeight: '100vh' },
  listingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' as const, gap: 10 },
  heading: { margin: 0, fontSize: 22, color: '#3B4A1E' },
  subheading: { margin: '2px 0 0', fontSize: 13, color: '#999' },
  createBtn: { background: '#6B8728', color: '#fff', padding: '9px 18px', borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' as const },
  sectionTitle: { margin: '28px 0 14px', color: '#7A7A7A', fontSize: 16 },
  empty: { textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 15 },

  card: { border: '1px solid #D8DDCA', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.07)', cursor: 'pointer', height: '100%' },
  img: { width: '100%', height: 140, objectFit: 'cover' },
  imgPlaceholder: { height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, background: '#EEF0E8' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #F0F0EC' },
  categoryTag: { fontSize: 11, color: '#6B8728', fontWeight: 600 },
  uniformTag: { fontSize: 10, background: '#3B4A1E', color: '#C5D96A', padding: '2px 5px', borderRadius: 4, fontWeight: 600 },
  cardBody: { padding: 10 },
  cardTitle: { margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#2E3A10' },
  cardDesc: { margin: '0 0 8px', fontSize: 12, color: '#6B6B6B' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  bidLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 2 },
  bidAmount: { fontWeight: 700, fontSize: 15, color: '#6B8728' },
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  qtyTag: { fontSize: 11, color: '#6B8728', fontWeight: 600 },
  bidder: { fontSize: 11, color: '#888' },
  msg: { textAlign: 'center', padding: '60px 0', color: '#888' },
};
