# BrochureAI

**Live:** [brouchere-ai.netlify.app](https://brouchere-ai.netlify.app)

An AI-powered company brochure generator. Enter a company name and URL — the app scrapes the website, identifies key pages, and streams a polished brochure in seconds.

![BrochureAI](https://img.shields.io/badge/Powered%20by-GPT--4.1-7c3aed?style=flat-square) ![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square) 

## Features

- **Real-time streaming** — brochure text streams back word by word as it's generated
- **Smart scraping** — AI identifies and reads the most relevant pages (about, careers, products)
- **Three tones** — Professional, Friendly, or Witty
- **5,000-char context limit** — keeps API costs low while covering the essentials
- **Export** — copy to clipboard or download as Markdown

## How it works

1. Fetches all links from the company's homepage
2. GPT-4.1-nano selects up to 3 relevant pages (about, careers, etc.)
3. Scrapes text content from each page using [Cheerio](https://cheerio.js.org/)
4. Truncates aggregated content to 5,000 characters
5. Streams a structured brochure from GPT-4.1-mini via Server-Sent Events

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Netlify Functions v2 (Node 20) |
| AI | OpenAI GPT-4.1-mini (brochure), GPT-4.1-nano (link selection) |
| Scraping | Cheerio + built-in `fetch` |

## Local development

**Prerequisites:** Node 18+, an [OpenAI API key](https://platform.openai.com/api-keys)

```bash
# Clone and install
git clone <your-repo-url>
cd ai-brouchure-generation
npm install

# Install Netlify CLI (runs both frontend + functions locally)
npm install -g netlify-cli

# Set up environment
cp .env.example .env
# Edit .env → add your OPENAI_API_KEY

# Start dev server
netlify dev
# → http://localhost:8888
```

> **Note:** Use `netlify dev` instead of `npm run dev` so the serverless function is available at `/api/generate-brochure`.

## Deploy to Netlify

### Option 1 — Netlify UI (recommended)

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Select your repo — build settings are auto-detected from `netlify.toml`
4. **Site settings → Environment variables** → add `OPENAI_API_KEY`
5. Click **Deploy**

### Option 2 — Netlify CLI

```bash
netlify login
netlify init
netlify env:set OPENAI_API_KEY sk-proj-...
netlify deploy --prod
```

## Project structure

```
├── netlify/
│   └── functions/
│       └── generate-brochure.mjs   # Serverless function: scrape + stream
├── src/
│   ├── App.jsx                      # Root component, SSE state machine
│   ├── index.css                    # Tailwind + glassmorphism styles
│   └── components/
│       ├── Header.jsx
│       ├── GeneratorForm.jsx        # Company name, URL, tone selector
│       ├── StepsProgress.jsx        # 4-step progress indicator
│       ├── BrochureOutput.jsx       # Markdown renderer + copy/download
│       └── FeatureCards.jsx
├── netlify.toml                     # Build + function config
├── vite.config.js
└── tailwind.config.js
```

## Environment variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI secret key — set this in Netlify dashboard or `.env` |

## License

MIT
