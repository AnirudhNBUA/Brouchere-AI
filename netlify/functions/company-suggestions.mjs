import { load } from 'cheerio';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;
const REQUEST_TIMEOUT_MS = 6000;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeQuery(rawQuery) {
  return String(rawQuery || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, MAX_QUERY_LENGTH);
}

function toWebsiteUrl(rawUrl) {
  if (!rawUrl) return null;

  let candidate = String(rawUrl).trim();
  if (!candidate) return null;

  if (candidate.startsWith('//')) {
    candidate = `https:${candidate}`;
  }

  if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

function toDisplayUrl(websiteUrl) {
  try {
    const parsed = new URL(websiteUrl);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return websiteUrl;
  }
}

function normalizeCompanyName(name, websiteUrl) {
  const normalizedName = String(name || '').trim().replace(/\s+/g, ' ');
  if (normalizedName) return normalizedName;

  try {
    const parsed = new URL(websiteUrl);
    const hostname = parsed.hostname.replace(/^www\./i, '');
    const brand = hostname.split('.')[0] || hostname;
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  } catch {
    return '';
  }
}

function dedupeAndClamp(items, limit) {
  const seenHosts = new Set();
  const output = [];

  for (const item of items) {
    if (!item?.websiteUrl) continue;

    let host = item.websiteUrl;
    try {
      host = new URL(item.websiteUrl).hostname.toLowerCase();
    } catch {
      // Keep fallback host as-is
    }

    if (seenHosts.has(host)) continue;
    seenHosts.add(host);

    output.push({
      companyName: item.companyName,
      websiteUrl: item.websiteUrl,
      displayUrl: item.displayUrl || toDisplayUrl(item.websiteUrl),
    });

    if (output.length >= limit) break;
  }

  return output;
}

function isSearchProviderHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return (
    host.includes('duckduckgo.com') ||
    host.includes('google.') ||
    host.includes('bing.com') ||
    host.includes('yahoo.')
  );
}

function parseDuckDuckGoTarget(rawHref) {
  if (!rawHref) return null;

  try {
    if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
      const asUrl = new URL(rawHref);
      const redirected = asUrl.searchParams.get('uddg');
      return redirected ? decodeURIComponent(redirected) : rawHref;
    }

    const absolute = new URL(rawHref, 'https://duckduckgo.com');
    const redirected = absolute.searchParams.get('uddg');
    return redirected ? decodeURIComponent(redirected) : null;
  } catch {
    return null;
  }
}

function guessCompanyNameFromTitle(title, websiteUrl) {
  const cleanTitle = String(title || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanTitle) {
    const primary = cleanTitle.split(/\s[\-|:]\s/)[0]?.trim();
    if (primary) return primary.slice(0, 80);
  }

  return normalizeCompanyName('', websiteUrl);
}

async function fetchClearbitSuggestions(query, limit) {
  const endpoint = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(endpoint, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'BrochureAI/1.0',
    },
  }, 5000);

  if (!res.ok) {
    throw new Error(`Clearbit lookup failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const mapped = data
    .map((entry) => {
      const websiteUrl = toWebsiteUrl(entry?.domain);
      if (!websiteUrl) return null;

      return {
        companyName: normalizeCompanyName(entry?.name, websiteUrl),
        websiteUrl,
        displayUrl: toDisplayUrl(websiteUrl),
      };
    })
    .filter(Boolean);

  return dedupeAndClamp(mapped, limit);
}

async function fetchDuckDuckGoSuggestions(query, limit) {
  const endpoint = `https://duckduckgo.com/html/?q=${encodeURIComponent(`${query} official website`)}`;
  const res = await fetchWithTimeout(endpoint, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0',
    },
  }, 5000);

  if (!res.ok) {
    throw new Error(`DuckDuckGo lookup failed with status ${res.status}`);
  }

  const html = await res.text();
  const $ = load(html);
  const collected = [];

  $('a.result__a').each((_, element) => {
    if (collected.length >= limit * 2) return;

    const rawHref = $(element).attr('href');
    const targetUrl = parseDuckDuckGoTarget(rawHref);
    const websiteUrl = toWebsiteUrl(targetUrl);
    if (!websiteUrl) return;

    try {
      const hostname = new URL(websiteUrl).hostname;
      if (isSearchProviderHost(hostname)) return;
    } catch {
      return;
    }

    const title = $(element).text();

    collected.push({
      companyName: guessCompanyNameFromTitle(title, websiteUrl),
      websiteUrl,
      displayUrl: toDisplayUrl(websiteUrl),
    });
  });

  return dedupeAndClamp(collected, limit);
}

function parseLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

async function getSuggestions(query, limit) {
  const provider = String(process.env.COMPANY_SUGGESTION_PROVIDER || 'auto').toLowerCase();

  if (provider === 'clearbit') {
    return fetchClearbitSuggestions(query, limit);
  }

  if (provider === 'duckduckgo') {
    return fetchDuckDuckGoSuggestions(query, limit);
  }

  try {
    const clearbit = await fetchClearbitSuggestions(query, limit);
    if (clearbit.length > 0) return clearbit;
  } catch {
    // Fall through to DuckDuckGo.
  }

  return fetchDuckDuckGoSuggestions(query, limit);
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(),
      },
    });
  }

  const requestUrl = new URL(req.url);
  const query = normalizeQuery(requestUrl.searchParams.get('query'));
  const limit = parseLimit(requestUrl.searchParams.get('limit'));

  if (query.length < MIN_QUERY_LENGTH) {
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders(),
      },
    });
  }

  try {
    const suggestions = await getSuggestions(query, limit);

    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders(),
      },
    });
  } catch {
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ...corsHeaders(),
      },
    });
  }
};

export const config = { path: '/api/company-suggestions' };
