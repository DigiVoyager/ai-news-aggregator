import { Redis } from '@upstash/redis';
import { XMLParser } from 'fast-xml-parser';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const FEEDS = [
  { name: "TechCabal", url: "https://techcabal.com/feed/", cat: "Africa Tech & Funding", cap: 15 },
  { name: "Techpoint Africa", url: "https://techpoint.africa/feed/", cat: "Africa Tech & Funding", cap: 15 },
  { name: "Google News: AI Africa", url: "https://news.google.com/rss/search?q=AI+Africa+when:2d&hl=en-NG&gl=NG&ceid=NG:en", cat: "Africa Tech & Funding", cap: 12 },
  { name: "Google News: AI Creative Africa", url: "https://news.google.com/rss/search?q=AI+creative+economy+OR+Nollywood+OR+%22AI+music%22+Africa+when:5d&hl=en-NG&gl=NG&ceid=NG:en", cat: "Africa Tech & Funding", cap: 12 },
  { name: "Google News: AI Policy Africa", url: "https://news.google.com/rss/search?q=%22AI+policy%22+OR+NITDA+OR+%22AI+strategy%22+Nigeria+OR+Africa+when:5d&hl=en-NG&gl=NG&ceid=NG:en", cat: "Policy & Regulation", cap: 10 },
  { name: "Google News: AI Film & Movies", url: "https://news.google.com/rss/search?q=%22AI%22+film+OR+movie+OR+Hollywood+OR+Nollywood+when:3d&hl=en-NG&gl=NG&ceid=NG:en", cat: "Global AI Industry", cap: 8 },
  { name: "Rest of World", url: "https://www.restofworld.org/feed/", cat: "Global AI Industry", cap: 10 },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", cat: "Global AI Industry", cap: 15 },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", cat: "Global AI Industry", cap: 15 },
  { name: "Hacker News: AI", url: "https://hnrss.org/newest?q=AI&points=50", cat: "Global AI Industry", cap: 10 },
  { name: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index/", cat: "Policy & Regulation", cap: 10 },
];

const KEYWORDS = {
  "#OpenAI": /openai|gpt|chatgpt/i,
  "#Anthropic": /anthropic|claude/i,
  "#Google": /google|gemini|deepmind/i,
  "#Meta": /\bmeta\b|llama/i,
  "#xAI": /\bxai\b|grok/i,
  "#Robotics": /robot/i,
  "#LLM": /large language model|\bllm\b/i,
  "#AGI": /\bagi\b|artificial general intelligence/i,
  "#ComputerVision": /computer vision|image recognition/i,
  "#AIethics": /ethic|bias|fairness in ai/i,
  "#Regulation": /regulat|\bpolicy\b|congress|eu ai act|lawsuit|govern/i,
  "#Research": /paper|study|arxiv/i,
  "#Funding": /funding|raise[sd]?|valuation|series [a-e]|investment/i,
  "#Acquisition": /acqui|merger|buyout/i,
  "#Launch": /launch|unveil|introduc|debut/i,
  "#Hardware": /\bchip|gpu|nvidia|hardware/i,
  "#Nigeria": /nigeria|lagos|naira/i,
  "#Kenya": /kenya|nairobi/i,
  "#SouthAfrica": /south africa|johannesburg|cape town/i,
  "#Fintech": /fintech|payment|mobile money/i,
  "#Startup": /startup|founder/i,
  "#Fashion": /fashion|design house|textile|apparel/i,
  "#Film": /film|nollywood|movie|cinema|studio|\bvfx\b|hollywood|streaming/i,
  "#Music": /\bmusic\b|afrobeat|sound design/i,
  "#Health": /health|medical|diagnos|hospital/i,
  "#Agriculture": /agri|farm|crop/i,
  "#Education": /education|edtech|learning platform|university/i,
  "#Creative": /creative econom|artist|design(?!ed for)/i,
};

function getTags(text) {
  return Object.keys(KEYWORDS).filter((tag) => KEYWORDS[tag].test(text));
}

function decodeHtmlEntities(text) {
  const entities = {
    '&#8217;': "'", '&#8216;': "'", '&#8220;': '"', '&#8221;': '"',
    '&#8211;': '–', '&#8212;': '—', '&amp;': '&', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ',
  };
  return text.replace(/&#?\w+;/g, (match) => entities[match] || match);
}

// Google News RSS links are encoded redirects that require a browser session.
// This extracts the actual article URL from the encoded link using their
// public decode endpoint, falling back to the original if it fails.
async function decodeGoogleNewsUrl(encodedUrl) {
  try {
    if (!encodedUrl.includes('news.google.com')) return encodedUrl;
    const res = await fetch(
      `https://news.google.com/rss/articles/${encodedUrl.split('/articles/')[1]}`,
      {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (res.url && !res.url.includes('news.google.com')) return res.url;
    return encodedUrl;
  } catch {
    return encodedUrl;
  }
}

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return { items: [], debug: { name: feed.name, status: res.status, error: `HTTP ${res.status}` } };
    }

    const text = await res.text();
    const data = parser.parse(text);

    const rawItems = data?.rss?.channel?.item || data?.feed?.entry || [];
    const itemsArray = Array.isArray(rawItems) ? rawItems : [rawItems];

    const items = await Promise.all(itemsArray.slice(0, feed.cap || 10).map(async (item) => {
      const rawTitle = (item.title?.['#text'] || item.title || '').toString().trim();
      const title = decodeHtmlEntities(rawTitle);
      let link = item.link?.['@_href'] || item.link || '';
      if (typeof link === 'object') link = link['#text'] || '';
      link = link.toString().trim();

      // Decode Google News encoded redirect URLs to real article links
      if (link.includes('news.google.com')) {
        link = await decodeGoogleNewsUrl(link);
      }

      const pubDate = item.pubDate || item.published || item.updated || new Date().toISOString();

      return {
        title,
        link,
        source: feed.name,
        category: feed.cat,
        date: new Date(pubDate).toISOString(),
        tags: getTags(title),
      };
    }));

    return { items: items.filter(i => i.title && i.link && !i.link.includes('news.google.com')), debug: { name: feed.name, status: res.status, count: items.length } };
  } catch (err) {
    return { items: [], debug: { name: feed.name, status: 'ERR', error: err.message } };
  }
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const results = await Promise.all(FEEDS.map(fetchFeed));
  let allItems = results.flatMap(r => r.items);
  const debugInfo = results.map(r => r.debug);

  const seen = new Set();
  allItems = allItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  allItems = allItems.filter((item) => new Date(item.date).getTime() > sevenDaysAgo);
  allItems = allItems.slice(0, 150);

  await redis.set('news-items', JSON.stringify(allItems));
  await redis.set('last-updated', new Date().toISOString());
  await redis.set('source-health', JSON.stringify(debugInfo));

  return Response.json({
    success: true,
    count: allItems.length,
    updated: new Date().toISOString(),
    debug: debugInfo,
  });
}
