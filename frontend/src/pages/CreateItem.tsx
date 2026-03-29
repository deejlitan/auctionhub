import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createItem } from '../api/items';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Computers', 'Networking', 'Storage', 'Peripherals', 'Mobile & Tablets', 'Others'];

export default function CreateItem() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [endTime, setEndTime] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Computers');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    navigate('/login');
    return null;
  }

  const minEndTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await createItem({
        title,
        description,
        imageUrl: imageUrl || undefined,
        startingPrice: Number(startingPrice),
        endTime: new Date(endTime).toISOString(),
        quantity: Number(quantity),
        category,
      });
      navigate(`/items/${data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'Failed to create listing.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>List an Item for Auction</h2>
        <p style={styles.subtitle}>Fill in the details below to start your auction</p>
        {error && <p style={styles.error}>{error}</p>}

        <label style={styles.label}>Category *</label>
        <select style={styles.input} value={category} onChange={e => setCategory(e.target.value)} required>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={styles.label}>Title *</label>
        <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Dell Latitude Laptop" />

        <label style={styles.label}>Description *</label>
        <textarea style={{ ...styles.input, height: 100, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} required placeholder="Describe the item condition, specs, etc." />

        <label style={styles.label}>Image URL (optional)</label>
        <input style={styles.input} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…" />

        <label style={styles.label}>Starting Price (₱) *</label>
        <input style={styles.input} type="number" min="0.01" step="0.01" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} required />

        <label style={styles.label}>Quantity *</label>
        <input style={styles.input} type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} required />
        <p style={{ fontSize: 12, color: '#6B8728', margin: '-4px 0 0' }}>
          Set to 1 for a standard auction. Set to 2+ for a uniform price auction where top N bidders all win at the same price.
        </p>

        <label style={styles.label}>Auction End Date & Time *</label>
        <input style={styles.input} type="datetime-local" min={minEndTime} value={endTime} onChange={e => setEndTime(e.target.value)} required />

        <button style={styles.btn} disabled={loading}>{loading ? 'Creating…' : 'Create Listing'}</button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', background: '#EEF0E8' },
  card: { background: '#fff', padding: 36, borderRadius: 10, width: '100%', maxWidth: 520, boxShadow: '0 4px 20px rgba(0,0,0,.10)', display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #D8DDCA' },
  title: { margin: 0, fontSize: 22, color: '#2E3A10' },
  subtitle: { margin: '0 0 8px', fontSize: 13, color: '#888' },
  label: { fontSize: 13, fontWeight: 600, color: '#4A5A20' },
  input: { padding: '9px 12px', border: '1px solid #C5D48A', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', background: '#FAFFF4', outline: 'none' },
  btn: { marginTop: 8, padding: '10px', background: '#6B8728', color: '#fff', border: 'none', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#c0392b', fontSize: 13, margin: 0, background: '#fdf0f0', padding: '6px 10px', borderRadius: 4 },
};
