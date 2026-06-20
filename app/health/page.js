'use client';

import { useEffect, useState } from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return 'never';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function HealthPage() {
  const [health, setHealth] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data.health || []);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const okCount = health.filter((h) => h && typeof h.status === 'number' && h.status >= 200 && h.status < 300).length;

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2.5rem 1.25rem 4rem', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Source Health</h1>
      <p style={{ fontSize: '13px', color: '#777', marginBottom: '24px' }}>
        Internal view. Last refresh: {timeAgo(lastUpdated)} · {okCount} of {health.length} sources healthy
      </p>

      {loading && <p style={{ color: '#777', fontSize: '14px' }}>Loading…</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {health.map((h, idx) => {
          const isOk = h && typeof h.status === 'number' && h.status >= 200 && h.status < 300;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                background: isOk ? '#f3fbf4' : '#fdf3f2',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{h?.name || 'Unknown source'}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {isOk ? `${h.count} stories pulled` : h?.error || 'Failed'}
                </div>
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: isOk ? '#d4f0d8' : '#f7d9d5',
                  color: isOk ? '#1c6b2e' : '#9c2b1f',
                }}
              >
                {isOk ? `${h.status} OK` : (h?.status ?? 'ERR')}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
