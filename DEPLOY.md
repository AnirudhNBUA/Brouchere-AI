# Deploy to Netlify

## Quick Deploy (Netlify UI)

1. Push this repo to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Select your repo
4. Netlify auto-detects the settings from `netlify.toml` (build: `npm run build`, publish: `dist`)
5. Under **Site settings → Environment variables**, add:
   ```
   OPENAI_API_KEY = sk-proj-...
   COMPANY_SUGGESTION_PROVIDER = auto
   ```
6. Click **Deploy** — done!

## Local Development

```bash
# 1. Install Netlify CLI globally (once)
npm install -g netlify-cli

# 2. Copy env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
# Optional: set COMPANY_SUGGESTION_PROVIDER=auto|clearbit|duckduckgo

# 3. Run (serves both frontend + serverless functions)
npm run netlify
# → Opens at http://localhost:8888
```

## Project Structure

```
├── netlify/functions/
│   ├── company-suggestions.mjs ← Serverless function (company suggestion lookup)
│   └── generate-brochure.mjs   ← Serverless function (scraping + OpenAI streaming)
├── src/
│   ├── App.jsx                  ← Main React component
│   ├── components/              ← UI components
│   └── index.css                ← Tailwind + custom styles
├── netlify.toml                 ← Netlify build & function config
└── vite.config.js               ← Vite dev server config
```
