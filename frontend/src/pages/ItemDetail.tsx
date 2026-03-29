import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItem, getBids, getWinners, placeBid, type AuctionItem, type Bid, type WinnersResponse, type WinnerAllocation } from '../api/items';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const itemId = Number(id);
  const { userId, token } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<AuctionItem | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [winners, setWinners] = useState<WinnersResponse | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [qtyWanted, setQtyWanted] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    const [itemRes, bidsRes] = await Promise.all([getItem(itemId), getBids(itemId)]);
    setItem(itemRes.data);
    setBids(bidsRes.data);
    if (itemRes.data.quantity > 1) {
      const winnersRes = await getWinners(itemId);
      setWinners(winnersRes.data);
    }
  }

  useEffect(() => {
    fetchData().catch(() => setError('Failed to load item.')).finally(() => setLoading(false));
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [itemId]);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { navigate('/login'); return; }
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await placeBid(itemId, Number(bidAmount), isUniform ? qtyWanted : 1);
      setSuccess('Bid placed successfully!');
      setBidAmount('');
      await fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to place bid.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p style={styles.msg}>Loading…</p>;
  if (!item) return <p style={styles.msg}>Item not found.</p>;

  const isUniform = item.quantity > 1;
  const isOwner = item.createdByUserId === userId;
  const auctionEnded = !item.isActive || new Date(item.endTime + 'Z') <= new Date();

  // Per-mode derived state
  const userBid = isUniform ? bids.find(b => b.userId === userId) : null;
  const userAllocation = isUniform ? winners?.winners.find((w: WinnerAllocation) => w.userId === userId) : null;
  const isWinning = isUniform
    ? (userAllocation !== null && userAllocation !== undefined)
    : item.currentBidderId === userId;
  const isHighestBidder = !isUniform && item.currentBidderId === userId;

  const minBid = isUniform ? item.startingPrice : item.currentBid + 0.01;
  const clearingPrice = winners?.clearingPrice ?? item.currentBid;
  const spotsLeft = winners?.spotsAvailable ?? item.quantity;
  const unitsFilled = winners?.unitsFilled ?? 0;

  // Unique bidders for uniform auction display
  const uniqueBids = isUniform
    ? Object.values(
        bids.reduce<Record<number, Bid>>((acc, b) => {
          if (!acc[b.userId] || b.amount > acc[b.userId].amount) acc[b.userId] = b;
          return acc;
        }, {})
      ).sort((a, b) => b.amount - a.amount)
    : bids;

  return (
    <div style={styles.page}>
      <button onClick={() => navigate(-1)} style={styles.back}>← Back</button>

      <div style={styles.layout}>
        <div>
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.title} style={styles.img} />
            : <div style={styles.imgPlaceholder}>🔨</div>
          }
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <h1 style={styles.title}>{item.title}</h1>
            <span style={{ ...styles.badge, background: !auctionEnded ? '#6B8728' : '#7A7A7A' }}>
              {!auctionEnded ? 'LIVE' : 'ENDED'}
            </span>
          </div>

          <div style={styles.categoryBadge}>
            {item.category}
          </div>

          {isUniform && (
            <div style={styles.uniformInfo}>
              ⚖️ <strong>Uniform Price Auction</strong> — {item.quantity} units available.
              Top {item.quantity} bidders all win and pay the same clearing price.
            </div>
          )}

          <p style={styles.desc}>{item.description}</p>

          <div style={styles.metaLabels}>
            <span style={styles.metaLabel}>📦 {item.quantity} unit{item.quantity !== 1 ? 's' : ''}</span>
            <span style={styles.metaSep}>·</span>
            <span style={styles.metaLabel}>⏱ <CountdownTimer endTime={item.endTime} /></span>
            {isUniform && (
              <>
                <span style={styles.metaSep}>·</span>
                <span style={styles.metaLabel}>🪑 {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
              </>
            )}
          </div>

          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statLabel}>Starting Price</div>
              <div style={styles.statValue}>₱{item.startingPrice.toFixed(2)}</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statLabel}>{isUniform ? 'Clearing Price' : 'Current Bid'}</div>
              <div style={{ ...styles.statValue, color: '#6B8728', fontSize: 22 }}>
                ₱{(isUniform ? clearingPrice : item.currentBid).toFixed(2)}
              </div>
            </div>
          </div>

          {!isUniform && item.currentBidderName && (
            <p style={styles.bidderInfo}>
              Highest bidder: <strong>{item.currentBidderName}</strong>
              {isHighestBidder && ' (you)'}
            </p>
          )}

          {isUniform && userBid && (
            <p style={styles.bidderInfo}>
              Your current bid: <strong>₱{userBid.amount.toFixed(2)}</strong>
              {isWinning ? ' 🏆 Winning!' : ' — not in top positions yet'}
            </p>
          )}

          {/* Owner banner */}
          {!auctionEnded && isOwner && (
            <div style={styles.ownerBanner}>
              📦 You listed this item — owners cannot bid on their own auctions.
            </div>
          )}

          {/* Winning banner (single) */}
          {!auctionEnded && !isUniform && !isOwner && isHighestBidder && (
            <div style={styles.winningBanner}>
              🏆 You are currently the highest bidder!
            </div>
          )}

          {/* Winning / not winning (uniform) */}
          {!auctionEnded && isUniform && !isOwner && userBid && isWinning && (
            <div style={styles.winningBanner}>
              🏆 You are in a winning position! Clearing price: ₱{clearingPrice.toFixed(2)}
            </div>
          )}
          {!auctionEnded && isUniform && !isOwner && userBid && !isWinning && (
            <div style={styles.losingBanner}>
              ⚠️ You are not in a winning position. Raise your bid to compete!
            </div>
          )}

          {/* Bid form */}
          {!auctionEnded && !isOwner && (!isHighestBidder || isUniform) && (
            <form onSubmit={handleBid} style={styles.bidForm}>
              <h3 style={{ margin: '0 0 4px', color: '#3B4A1E' }}>
                {isUniform && userBid ? 'Update Your Bid' : 'Place a Bid'}
              </h3>
              {isUniform && (
                <p style={styles.bidHint}>
                  Minimum: ₱{item.startingPrice.toFixed(2)} · You can update your bid anytime. · {spotsLeft} unit{spotsLeft !== 1 ? 's' : ''} remaining.
                </p>
              )}
              {error && <p style={styles.error}>{error}</p>}
              {success && <p style={styles.success}>{success}</p>}
              {isUniform && (
                <div style={styles.qtyRow}>
                  <label style={styles.qtyLabel}>Units to buy</label>
                  <div style={styles.qtyControls}>
                    <button type="button" style={styles.qtyBtn} onClick={() => setQtyWanted(q => Math.max(1, q - 1))}>−</button>
                    <span style={styles.qtyDisplay}>{qtyWanted}</span>
                    <button type="button" style={styles.qtyBtn} onClick={() => setQtyWanted(q => Math.min(item.quantity, q + 1))}>+</button>
                    <span style={styles.qtyMax}>of {item.quantity} max</span>
                  </div>
                </div>
              )}
              <div style={styles.bidRow}>
                <span style={styles.peso}>₱</span>
                <input
                  style={styles.bidInput}
                  type="number"
                  step="0.01"
                  min={minBid}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  placeholder={`Price per unit, min ₱${minBid.toFixed(2)}`}
                  required
                />
                <button style={styles.bidBtn} disabled={submitting}>
                  {submitting ? 'Placing…' : isUniform && userBid ? 'Update Bid' : 'Bid Now'}
                </button>
              </div>
              {isUniform && bidAmount && (
                <p style={styles.bidSummary}>
                  Total if you win: ₱{(Number(bidAmount) * qtyWanted).toFixed(2)} ({qtyWanted} unit{qtyWanted !== 1 ? 's' : ''} × clearing price)
                </p>
              )}
              {!token && <p style={styles.loginNote}>You must be logged in to bid. <a href="/login">Sign in</a></p>}
            </form>
          )}

          {/* Ended — single winner */}
          {auctionEnded && !isUniform && item.currentBidderName && (
            <div style={styles.winner}>
              🏆 Winner: <strong>{item.currentBidderName}</strong> — ₱{item.currentBid.toFixed(2)}
            </div>
          )}

          {/* Ended — uniform winners */}
          {auctionEnded && isUniform && winners && (
            <div style={styles.winner}>
              <p style={{ margin: '0 0 8px', fontSize: 15 }}>
                🏆 <strong>Final Clearing Price: ₱{winners.clearingPrice?.toFixed(2) ?? '—'}</strong>
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
                {winners.winners.length} winner{winners.winners.length !== 1 ? 's' : ''} — {unitsFilled} of {item.quantity} units sold
              </p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {winners.winners.map((w: WinnerAllocation) => (
                  <li key={w.userId} style={{ fontSize: 14, marginBottom: 4 }}>
                    <strong>{w.username}</strong> — {w.quantityAllocated} unit{w.quantityAllocated !== 1 ? 's' : ''} ×
                    ₱{winners.clearingPrice?.toFixed(2)} = <strong>₱{((winners.clearingPrice ?? 0) * w.quantityAllocated).toFixed(2)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bid history / current bids */}
      <div style={styles.bidsSection}>
        <h2 style={{ margin: '0 0 16px', color: '#3B4A1E' }}>
          {isUniform ? `Current Bids (${uniqueBids.length} unique bidder${uniqueBids.length !== 1 ? 's' : ''})` : `Bid History (${bids.length})`}
        </h2>
        {uniqueBids.length === 0 ? (
          <p style={{ color: '#888' }}>No bids yet. Be the first!</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={{ background: '#EEF0E8' }}>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Bidder</th>
                <th style={styles.th}>Price/unit</th>
                {isUniform && <th style={styles.th}>Qty wanted</th>}
                {isUniform && <th style={styles.th}>Allocated</th>}
                <th style={styles.th}>{isUniform ? 'Status' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {uniqueBids.map((bid, i) => {
                const allocation = isUniform ? winners?.winners.find((w: WinnerAllocation) => w.userId === bid.userId) : null;
                const isWinner = isUniform ? !!allocation : i === 0;
                return (
                  <tr key={bid.id} style={{ background: isWinner ? '#F4F8EC' : 'transparent' }}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>
                      {bid.username}
                      {isWinner && <span style={styles.topBadge}>WIN</span>}
                    </td>
                    <td style={{ ...styles.td, fontWeight: isWinner ? 700 : 400, color: isWinner ? '#6B8728' : '#333' }}>
                      ₱{bid.amount.toFixed(2)}
                    </td>
                    {isUniform && <td style={styles.td}>{bid.quantityWanted}</td>}
                    {isUniform && <td style={{ ...styles.td, color: isWinner ? '#6B8728' : '#aaa', fontWeight: isWinner ? 700 : 400 }}>
                      {allocation ? allocation.quantityAllocated : 0}
                    </td>}
                    <td style={styles.td}>
                      {isUniform
                        ? <span style={{ color: isWinner ? '#6B8728' : '#c0392b', fontWeight: 600 }}>{isWinner ? '✓ Winning' : '✗ Not winning'}</span>
                        : new Date(bid.bidTime).toLocaleString()
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {isUniform && uniqueBids.length > 0 && (
          <p style={{ marginTop: 10, fontSize: 13, color: '#888' }}>
            Clearing price (paid by all winners): ₱{clearingPrice.toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px', background: '#F4F5F0', minHeight: '100vh' },
  back: { background: 'none', border: 'none', color: '#6B8728', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0, fontWeight: 600 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 },
  img: { width: '100%', borderRadius: 8, objectFit: 'cover', maxHeight: 400 },
  imgPlaceholder: { height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, background: '#EEF0E8', borderRadius: 8 },
  title: { margin: '0 0 12px', fontSize: 24, color: '#2E3A10' },
  badge: { padding: '4px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  categoryBadge: { display: 'inline-block', background: '#EEF0E8', border: '1px solid #C5D48A', color: '#6B8728', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginBottom: 12 },
  uniformInfo: { background: '#EEF0E8', border: '1px solid #C5D48A', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#3B4A1E', marginBottom: 14 },
  desc: { color: '#5A5A5A', lineHeight: 1.6, marginBottom: 20 },
  metaLabels: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' as const },
  metaLabel: { fontSize: 13, color: '#6B8728', fontWeight: 600 },
  metaSep: { color: '#ccc', fontSize: 13 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 10 },
  stat: { background: '#EEF0E8', padding: 12, borderRadius: 6, border: '1px solid #D8DDCA' },
  statLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontWeight: 700, fontSize: 18, color: '#3B4A1E' },
  bidderInfo: { fontSize: 14, color: '#555', marginBottom: 14 },
  bidForm: { background: '#F0F4E4', border: '1px solid #C5D48A', borderRadius: 8, padding: 20 },
  bidHint: { margin: '0 0 10px', fontSize: 12, color: '#6B8728' },
  bidRow: { display: 'flex', alignItems: 'center', gap: 8 },
  peso: { fontSize: 20, color: '#6B8728', fontWeight: 700 },
  bidInput: { flex: 1, padding: '10px 12px', border: '1px solid #C5D48A', borderRadius: 4, fontSize: 16, background: '#fff' },
  bidBtn: { padding: '10px 20px', background: '#6B8728', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 15 },
  error: { color: '#c0392b', fontSize: 13, margin: '0 0 10px', background: '#fdf0f0', padding: '6px 10px', borderRadius: 4 },
  success: { color: '#6B8728', fontSize: 13, margin: '0 0 10px', fontWeight: 600 },
  loginNote: { fontSize: 12, color: '#888', marginTop: 8 },
  winner: { background: '#F0F4E4', border: '2px solid #6B8728', borderRadius: 8, padding: 16, color: '#3B4A1E' },
  winningBanner: { background: '#F0F4E4', border: '2px solid #6B8728', borderRadius: 8, padding: 14, fontSize: 14, color: '#3B4A1E', fontWeight: 600, textAlign: 'center', marginBottom: 12 },
  losingBanner: { background: '#FFF8F0', border: '2px solid #E67E22', borderRadius: 8, padding: 14, fontSize: 14, color: '#7D4B10', fontWeight: 600, textAlign: 'center', marginBottom: 12 },
  ownerBanner: { background: '#F5F5F5', border: '2px solid #AAAAAA', borderRadius: 8, padding: 14, fontSize: 14, color: '#555', fontWeight: 600, textAlign: 'center', marginBottom: 12 },
  bidsSection: { borderTop: '2px solid #D8DDCA', paddingTop: 24 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #D8DDCA', fontSize: 13, color: '#6B6B6B', fontWeight: 600 },
  td: { padding: '10px 12px', borderBottom: '1px solid #EAEAE6', fontSize: 14, color: '#333' },
  topBadge: { background: '#6B8728', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, marginLeft: 6, fontWeight: 700 },
  qtyRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  qtyLabel: { fontSize: 13, fontWeight: 600, color: '#4A5A20' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, border: '1px solid #C5D48A', borderRadius: 4, background: '#fff', fontSize: 18, cursor: 'pointer', color: '#6B8728', fontWeight: 700, lineHeight: 1 },
  qtyDisplay: { fontSize: 18, fontWeight: 700, color: '#2E3A10', minWidth: 24, textAlign: 'center' as const },
  qtyMax: { fontSize: 12, color: '#888' },
  bidSummary: { margin: '8px 0 0', fontSize: 12, color: '#6B8728', fontStyle: 'italic' },
  msg: { textAlign: 'center', padding: '60px 0', color: '#888' },
};
