import { load } from 'cheerio';
import OpenAI from 'openai';

const MAX_CONTENT_LENGTH = 5000;

/**
 * Fetch a URL with a timeout and browser-like headers.
 */
async function fetchUrl(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a potentially relative link to an absolute URL.
 */
function resolveUrl(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

/**
 * Fetch all links from a page.
 */
async function fetchWebsiteLinks(url) {
  try {
    const res = await fetchUrl(url, 8000);
    const html = await res.text();
    const $ = load(html);
    const links = new Set();
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const resolved = resolveUrl(href, url);
      if (resolved && !resolved.startsWith('mailto:') && !resolved.startsWith('tel:')) {
        links.add(resolved);
      }
    });
    return Array.from(links).slice(0, 40);
  } catch {
    return [];
  }
}

/**
 * Fetch readable text content from a page.
 */
async function fetchWebsiteContents(url) {
  try {
    const res = await fetchUrl(url, 8000);
    const html = await res.text();
    const $ = load(html);

    // Remove noise
    $('script, style, noscript, nav, footer, header, .cookie-banner, [class*="cookie"], [id*="cookie"]').remove();

    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const bodyText = $('body')
      .text()
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return `Title: ${title}\nDescription: ${metaDesc}\n\n${bodyText}`.slice(0, 2000);
  } catch (e) {
    return `[Could not fetch content from ${url}]`;
  }
}

/**
 * Use OpenAI to select the most relevant links for a brochure.
 */
async function selectRelevantLinks(openai, links, baseUrl) {
  const systemPrompt = `You are provided with links from a company website.
Decide which links are most relevant for a company brochure: About, Company, Team, Careers, Products/Services, Mission, Values pages.
Respond only with JSON: {"links": [{"type": "about page", "url": "https://..."}, ...]}
Include at most 3 links. Ignore social media, privacy, terms, login, and external links.`;

  const userPrompt = `Base URL: ${baseUrl}\n\nLinks found:\n${links.slice(0, 40).join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    });
    const parsed = JSON.parse(response.choices[0].message.content);
    return Array.isArray(parsed.links) ? parsed.links : [];
  } catch {
    return [];
  }
}

/** Netlify v2 function handler */
export default async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const { companyName, url, tone = 'professional' } = body;

  if (!companyName || !url) {
    return new Response(JSON.stringify({ error: 'companyName and url are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const openai = new OpenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Fetch links
        send({ type: 'step', step: 1, message: 'Fetching website links…' });
        const links = await fetchWebsiteLinks(url);

        // Step 2: Select relevant links
        send({ type: 'step', step: 2, message: 'Identifying key pages…' });
        const relevantLinks = await selectRelevantLinks(openai, links, url);

        // Step 3: Fetch content
        send({ type: 'step', step: 3, message: 'Reading website content…' });
        let aggregatedContent = `## Landing Page:\n${await fetchWebsiteContents(url)}\n`;

        for (const link of relevantLinks.slice(0, 3)) {
          send({ type: 'step', step: 3, message: `Reading ${link.type}…` });
          const pageContent = await fetchWebsiteContents(link.url);
          aggregatedContent += `\n## ${link.type}:\n${pageContent}\n`;
        }

        // Enforce 5000-char limit (matches original notebook)
        const truncatedContent = aggregatedContent.slice(0, MAX_CONTENT_LENGTH);

        // Step 4: Generate brochure with streaming
        send({ type: 'step', step: 4, message: 'Generating brochure…' });

        const toneMap = {
          professional: 'professional and authoritative',
          friendly: 'friendly, warm, and approachable',
          witty: 'witty, entertaining, and humorous',
        };

        const systemPrompt = `You are an expert copywriter. Analyze the company website content and create a compelling, well-structured brochure for prospective customers, investors, and recruits.
Respond in markdown (no code blocks). Structure with clear sections: Overview, Products/Services, Culture, Why Join / Why Choose Us.
Include company culture, customer highlights, and career opportunities if available.
Tone: ${toneMap[tone] || toneMap.professional}.`;

        const userPrompt = `Company name: ${companyName}\n\nWebsite content:\n${truncatedContent}`;

        const brochureStream = await openai.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: true,
          max_tokens: 1800,
        });

        for await (const chunk of brochureStream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            send({ type: 'chunk', content: text });
          }
        }

        send({ type: 'done' });
      } catch (err) {
        send({ type: 'error', message: err.message || 'An unexpected error occurred.' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      ...corsHeaders(),
    },
  });
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export const config = { path: '/api/generate-brochure' };
