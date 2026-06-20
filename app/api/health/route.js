import { kv } from '@vercel/kv';

// This just reads whatever the refresh job last saved about each source's
// status (did it succeed, fail, how many stories did it return).
export async function GET() {
  const health = await kv.get('source-health') || [];
  const lastUpdated = await kv.get('last-updated') || null;

  return Response.json({
    health,
    lastUpdated,
  });
}
