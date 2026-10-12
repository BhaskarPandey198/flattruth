# FlatTruth

FlatTruth helps prospective tenants investigate a housing society before signing a lease. It retrieves public records for a society and city, preserves source provenance and geographic scope, and turns only supported signals into tenant-risk assessments.

Built for the **SerpApi India Hackathon 2026** — **Knowledge & Public Interest**.

## Problem and solution

Renters often make high-stakes decisions using scattered reviews, news reports, and locality context. FlatTruth brings those public records into one place while avoiding a common AI-search failure: treating missing or nearby information as a claim about a particular society.

```text
Society + city
  -> SerpApi Maps property resolution
  -> community/web + news/civic retrieval
  -> Maps reviews (high-confidence match) OR locality/civic retrieval
  -> normalized evidence dossier
  -> Gemini-grounded classification + deterministic server scoring
  -> source-backed dashboard, tenant Q&A, lease discussion points
```

Each record retains its direct URL when trustworthy, domain, title, snippet, date, platform, quality tier, identity confidence, relevance, and `society` / `locality` / `city` scope. Only eligible records influence analysis. Nearby evidence is context only and never creates a society-specific score.

## SerpApi integration

SerpApi is core infrastructure, not a cosmetic call:

| Engine | Why it matters |
| --- | --- |
| `google_maps` | Resolves society identity, address, locality, and confidence. |
| `google` | Retrieves tenant-relevant community and public-web discussion. |
| `google` with `tbm=nws` | Retrieves news and civic context. |
| `google_maps_reviews` | Retrieves recent reviews only after a high-confidence Maps match. |

A cold audit makes at most four calls: Maps first, then concurrent web/news plus either Maps Reviews or a broader locality/civic search. Eligible repeated audits use an application cache. The assistant uses the dossier first and may make at most one targeted SerpApi retrieval when needed.

## Evidence and scoring

- No invented reviews, titles, dates, prices, counts, or civic claims.
- Missing negative evidence is not evidence of safety.
- Locality/city evidence is never represented as a society-specific claim.
- Unsupported categories remain unscored.
- Risk scores: 0–34 low, 35–64 moderate, 65–100 high; `null` means not enough direct evidence.
- Maps star ratings never directly determine tenant risk.

Gemini receives normalized retrieved records only, must cite supplied IDs, and cannot assign numeric scores. Server rules validate citations and calculate scores. If Gemini is unavailable, FlatTruth may present a conservative assessment based only on explicit concern language in eligible evidence; it never invents missing evidence.

## Run locally

Requirements: Node.js 20+, a SerpApi key, and a Gemini API key.

```bash
npm install
copy .env.example .env.local
```

Set server-only values in `.env.local`:

```bash
SERPAPI_API_KEY=...
GEMINI_API_KEY=...
```

Never prefix these values with `NEXT_PUBLIC_`. `.env.local` is ignored by Git.

```bash
npm.cmd run dev          # http://localhost:4028
npm.cmd run type-check
npm.cmd run build
npm.cmd run start        # production server, port 4028
```

If port 4028 is occupied, reuse a verified FlatTruth server or stop only a process you have confirmed owns it.

## Limitations

Public search coverage is uneven. A lack of reports does not prove safety. FlatTruth is not legal, housing, or financial advice: review original sources, verify identity, visit the property, and use the lease discussion points as questions for the owner or manager.

## Existing-project and AI-tool disclosure

FlatTruth began as an earlier Rocket.new prototype. The submitted hackathon version materially changed the product with live SerpApi evidence retrieval, property resolution, source hygiene/provenance, deterministic risk scoring, grounded tenant Q&A, and evidence-backed safeguards.

Development tools used: Rocket.new for initial UI/project scaffolding; Gemini for evidence-grounded classification and Q&A; OpenAI Codex for implementation, debugging, and QA; and ChatGPT where used for architecture, product review, debugging strategy, and documentation guidance. Public evidence—not model-generated claims—is the basis for displayed findings.

## Demo guidance

Record the app running locally, stay under three minutes, and show a society search, risk/evidence result, original source card, cited tenant-assistant answer, and lease discussion point. Do not show API keys, `.env.local`, raw SerpApi URLs, or internal logs.
