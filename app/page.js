'use client';

import { useEffect, useState } from 'react';

const CATEGORIES = ['All', 'Industry', 'Research', 'Tools', 'Policy'];

export default function Home() {
  const [items, setItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  async function loadNews() {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setItems(data.items || []);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === 'All' ? items : items.filter((i) => i.category === filter);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>AI News Feed</h1>
        <span style={{ fontSize: '13px', color: '#777' }}>
          {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'Loading...'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '0.5px solid #ddd',
              background: filter === cat ? '#e6f1fb' : '#fff',
              color: filter === cat ? '#0c447c' : '#333',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#777', fontSize: '14px' }}>Loading news...</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ color: '#777', fontSize: '14px' }}>
          No stories yet. The background updater may not have run yet (it runs every minute via cron-job.org).
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.map((item, idx) => (
          
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px 16px',
              border: '0.5px solid #e5e5e5',
              borderRadius: '8px',
              background: '#fff',
              textDecoration: 'none',
              color: '#1a1a1a',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{item.title}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#888', flexWrap: 'wrap' }}>
              <span>{item.source}</span>
              <span>·</span>
              <span>{new Date(item.date).toLocaleString()}</span>
              {item.tags.map((tag) => (
                <span key={tag} style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: '6px' }}>
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
