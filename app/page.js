'use client';

import { useEffect, useState, useMemo } from 'react';

const CATEGORIES = ['All', 'Africa Tech & Funding', 'Global AI Industry', 'Policy & Regulation'];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diffMs / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState(null);
  const [window48h, setWindow48h] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const allTags = useMemo(() => {
    const counts = {};
    items.forEach((i) => i.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t]) => t);
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (window48h) {
      const cutoff = Date.now() - 48 * 3600000;
      list = list.filter((i) => new Date(i.date).getTime() > cutoff);
    }
    if (filter !== 'All') list = list.filter((i) => i.category === filter);
    if (tagFilter) list = list.filter((i) => i.tags.includes(tagFilter));
    if (search.trim()) {
      const q = search.trim().toLowerCase().replace(/^#/, '');
      list = list.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, filter, tagFilter, window48h, search]);

  const categoryCounts = useMemo(() => {
    const counts = { All: items.length };
    CATEGORIES.slice(1).forEach((cat) => {
      counts[cat] = items.filter((i) => i.category === cat).length;
    });
    return counts;
  }, [items]);

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      <style>{`
        @keyframes bb-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bb-card:hover {
          transform: translateY(-2px);
          border-color: #d9a073 !important;
          box-shadow: 0 6px 16px rgba(184, 92, 56, 0.12);
        }
        .bb-pill {
          transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .bb-pill:hover { transform: translateY(-1px); }
        .bb-pill:active { transform: scale(0.96); }
        .bb-tag:hover { background: #e8dcc8 !important; }
        .bb-toggle:hover { border-color: #d9a073 !important; color: #b85c38 !important; }
      `}</style>

      <header style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
          <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '28px', fontWeight: 700, margin: 0, color: '#2b1d14' }}>
            🐝 Bumblebee News
          </h1>
          <span style={{ fontSize: '12px', color: '#9c8a78' }}>
            {lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : 'Loading…'}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#8a7866', margin: '4px 0 0' }}>
          AI &amp; tech news for Africa's creative and business builders, plain language, no jargon, no AI-written summaries.
        </p>
      </header>

      <input
        type="text"
        placeholder="Search by keyword or hashtag, e.g. fintech, Nigeria, OpenAI"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          fontSize: '13px',
          padding: '10px 14px',
          borderRadius: '8px',
          border: '1px solid #e3d9cd',
          background: '#fff',
          color: '#2b1d14',
          marginBottom: '14px',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="bb-pill"
            style={{
              fontSize: '13px',
              padding: '6px 12px',
              borderRadius: '999px',
              border: filter === cat ? '1px solid #b85c38' : '1px solid #e3d9cd',
              background: filter === cat ? '#b85c38' : '#fff',
              color: filter === cat ? '#fff' : '#5c4a3a',
              cursor: 'pointer',
              fontWeight: filter === cat ? 600 : 400,
            }}
          >
            {cat} {categoryCounts[cat] > 0 ? `(${categoryCounts[cat]})` : ''}
          </button>
        ))}
      </div>

      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className="bb-pill bb-tag"
              style={{
                fontSize: '12px',
                padding: '3px 9px',
                borderRadius: '6px',
                border: 'none',
                background: tagFilter === tag ? '#2b1d14' : '#f4ede3',
                color: tagFilter === tag ? '#fff' : '#7a6a58',
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '12px', color: '#9c8a78' }}>
        <button
          onClick={() => setWindow48h(!window48h)}
          className="bb-pill bb-toggle"
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #e3d9cd',
            background: '#fff',
            color: '#5c4a3a',
            cursor: 'pointer',
          }}
        >
          {window48h ? 'Showing last 48 hours' : 'Showing last 7 days'} · tap to switch
        </button>
      </div>

      {loading && <p style={{ color: '#9c8a78', fontSize: '14px' }}>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ color: '#9c8a78', fontSize: '14px' }}>
          Nothing in this window yet. Try expanding to 7 days, or check back shortly, the feed refreshes every 2 minutes.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bb-card"
            style={{
              display: 'block',
              padding: '14px 16px',
              border: '1px solid #ece3d6',
              borderRadius: '10px',
              background: '#fffdfa',
              textDecoration: 'none',
              color: '#2b1d14',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
              animation: `bb-fade-in 0.4s ease ${Math.min(idx * 0.03, 0.6)}s both`,
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', lineHeight: 1.4 }}>{item.title}</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: '#a89785', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#b85c38' }}>{item.category}</span>
              <span>·</span>
              <span>{item.source}</span>
              <span>·</span>
              <span>{timeAgo(item.date)}</span>
              {item.tags.map((tag) => (
                <span key={tag} style={{ background: '#f4ede3', padding: '2px 7px', borderRadius: '5px', color: '#7a6a58' }}>
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>

      <footer style={{ marginTop: '3rem', fontSize: '11px', color: '#bdae9d', textAlign: 'center' }}>
        Raw headlines and links only. No AI-generated summaries.
      </footer>
    </main>
  );
}
