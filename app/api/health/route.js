import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function GET() {
  try {
    const raw = await redis.get('news-items');
    const items = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
    const lastUpdated = await redis.get('last-updated') || null;

    return Response.json({ items, lastUpdated });
  } catch (err) {
    return Response.json({ items: [], lastUpdated: null, error: err.message });
  }
}
