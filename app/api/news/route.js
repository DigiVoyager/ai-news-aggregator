import { kv } from '@vercel/kv';

export async function GET() {
  const items = await kv.get('news-items') || [];
  const lastUpdated = await kv.get('last-updated') || null;

  return Response.json({
    items,
    lastUpdated,
  });
}
