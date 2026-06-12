import { kv } from '@vercel/kv';
import { XMLParser } from 'fast-xml-parser';

// This is the list of news sources we check.
// "url" = where the news comes from
// "cat" = which category it gets grouped under
const FEEDS = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", cat: "Industry" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", cat: "Industry" },
  { name: "MIT Tech Review", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", cat: "Research" },
  { name: "ArXiv cs.AI", url: "http://export.arxiv.org/rss/cs.AI", cat: "Research" },
  { name: "The Verge AI", url: "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", cat: "Tools" },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index/", cat: "Policy" },
];

// These are the hashtags. If a headline contains one of these words/phrases,
// it gets that hashtag automatically.
const KEYWORDS = {
  "#OpenAI": /openai|gpt|chatgpt/i,
  "#Anthropic": /anthropic|claude/i,
  "#Google": /google|gemini|deepmind/i,
  "#Meta": /\bmeta\b|llama/i,
  "#Robotics": /robot/i,
  "#LLM": /large language model|\bllm\b/i,
  "#Regulation": /regulat|policy|congress|eu ai act|lawsuit/i,
  "#Research": /paper|study|arxiv/i,
  "#Funding": /funding|raise[sd]?|valuation|series [a-e]/i,
  "#Hardware": /\bchip|gpu|nvidia|hardware/i,
};

function getTags(text) {
  return Object.keys(KEYWORDS).filter((tag) => KEYWORDS[tag].test(text));
}

const parser = new XMLParser({ ignoreAttributes: false });

// Goes and fetches one news source, turns the raw feed into a clean list
async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (AI News Aggregator)' },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    const data = parser.parse(text);

    // RSS feeds and Atom feeds are structured slightly differently,
    // so we check for both shapes
    const rawItems =
      data?.rss?.channel?.item ||
      data?.feed?.entry ||
      [];

    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    return itemsArray.slice(0, 10).map((item) => {
      const title = (item.title?.['#text'] || item.title || '').toString().trim();
      let link = item.link?.['@_href'] || item.link || '';
      if (typeof link === 'object') link = link['#text'] || '';
      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();

      return {
        title,
        link: link.toString().trim(),
        source: feed.name,
        category: feed.cat,
        date: new Date(pubDate).toISOString(),
        tags: getTags(title),
      };
    }).filter(i => i.title && i.link);
  } catch (err) {
    console.error(`Failed to fetch ${feed.name}:`, err.message);
    return [];
  }
}

export async function GET(request) {
  // Security check: only allow this to run if the request includes our secret password
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Go fetch all 6 sources at the same time
  const results = await Promise.all(FEEDS.map(fetchFeed));
  let allItems = results.flat();

  // Remove duplicate stories (same link)
  const seen = new Set();
  allItems = allItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  // Newest first
  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Keep only the most recent 100 stories to keep things fast
  allItems = allItems.slice(0, 100);

  // Save to the database (Vercel KV) along with the time we updated it
  await kv.set('news-items', allItems);
  await kv.set('last-updated', new Date().toISOString());

  return Response.json({
    success: true,
    count: allItems.length,
    updated: new Date().toISOString(),
  });
}
