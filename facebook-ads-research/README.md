# Pakistan Facebook Ads Research Tool

Research trending products in Pakistan by analyzing the Facebook Ads Library. Find ads that have been running for 2+ months — a strong signal of profitable, proven products.

## Features

- **Long-Running Ad Detection** — flags ads active for 60+ days (proven sellers)
- **Trend Analysis** — category breakdown, top advertisers, keyword cloud
- **Quick Category Search** — Beauty, Fashion, Electronics, Health, Food, Real Estate, Education
- **Ad Detail Modal** — full body, spend estimates, impressions, platforms
- **CSV Export** — download all results for offline analysis
- **Sort by Days Running** — surface the most persistent campaigns first

## Quick Start

```bash
chmod +x start.sh
./start.sh
```

Open `frontend/index.html` in your browser and point Backend URL to `http://localhost:5000`.

## Getting a Facebook Access Token

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app (or create one at developers.facebook.com)
3. Add permission: `ads_read`
4. Click **Generate Access Token**
5. Copy and paste into the tool

> For longer sessions, generate a long-lived token via the Token Debugger.

## How It Works

The tool calls the **Facebook Ads Library API** (`/ads_archive`) with:
- `ad_reached_countries: ['PK']` — Pakistan only
- `ad_delivery_date_min: <60 days ago>` — filters for ads that started before the 2-month mark
- `ad_active_status: ACTIVE` — only currently running ads

Ads running 60+ days are highlighted as **long-running** — these indicate products/services with consistent ROI, making them reliable trend signals.

## Project Structure

```
facebook-ads-research/
├── backend/
│   ├── app.py          # Flask API server
│   └── requirements.txt
├── frontend/
│   └── index.html      # Full UI (React-free, single file)
├── start.sh            # One-command launcher
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search ads with filters |
| POST | `/api/trending` | Fetch trending by category |
| GET | `/api/health` | Health check |
