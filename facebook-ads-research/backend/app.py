import os
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import Counter
import re

app = Flask(__name__)
CORS(app)

FB_API_BASE = "https://graph.facebook.com/v19.0/ads_archive"

CATEGORY_KEYWORDS = {
    "Fashion & Clothing": ["clothes", "fashion", "dress", "shirt", "shoes", "wear", "outfit", "jeans", "kurta", "shalwar"],
    "Electronics": ["phone", "mobile", "laptop", "earphones", "charger", "gadget", "tech", "electronics", "speaker", "smartwatch"],
    "Beauty & Skincare": ["skincare", "cream", "serum", "beauty", "makeup", "lotion", "facewash", "moisturizer", "whitening"],
    "Health & Fitness": ["weight loss", "protein", "supplement", "fitness", "gym", "health", "diet", "slimming", "organic"],
    "Home & Kitchen": ["kitchen", "home", "furniture", "decor", "appliance", "cookware", "cleaning", "bedsheet", "curtain"],
    "Food & Beverages": ["food", "restaurant", "delivery", "snacks", "drinks", "tea", "coffee", "biryani", "halal"],
    "Education": ["course", "learning", "academy", "training", "skill", "certificate", "online class", "tutor"],
    "Real Estate": ["property", "house", "apartment", "plot", "real estate", "housing", "flat", "commercial"],
    "Finance": ["loan", "insurance", "investment", "bank", "finance", "savings", "earn money", "income"],
}


def get_two_months_ago():
    return (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")


def extract_keywords(text):
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    stop_words = {"this", "that", "with", "have", "from", "they", "will", "been", "more", "also", "your", "when", "were", "what"}
    return [w for w in words if w not in stop_words]


def categorize_ad(ad_text):
    if not ad_text:
        return "Uncategorized"
    text_lower = ad_text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return category
    return "Other"


def fetch_ads(access_token, search_terms="", ad_type="ALL", limit=50, page_ids=None):
    two_months_ago = get_two_months_ago()

    fields = [
        "id", "ad_creation_time", "ad_delivery_start_time", "ad_delivery_stop_time",
        "page_name", "page_id", "ad_creative_bodies", "ad_creative_link_captions",
        "ad_creative_link_descriptions", "ad_creative_link_titles",
        "ad_snapshot_url", "currency", "spend", "impressions",
        "demographic_distribution", "delivery_by_region", "publisher_platforms"
    ]

    params = {
        "access_token": access_token,
        "ad_reached_countries": "['PK']",
        "ad_delivery_date_min": two_months_ago,
        "ad_active_status": "ACTIVE",
        "fields": ",".join(fields),
        "limit": limit,
        "search_type": "KEYWORD_UNORDERED",
    }

    if search_terms:
        params["search_terms"] = search_terms

    if ad_type != "ALL":
        params["ad_type"] = ad_type

    if page_ids:
        params["search_page_ids"] = page_ids

    response = requests.get(FB_API_BASE, params=params, timeout=30)
    return response.json()


def enrich_ads(ads_data):
    enriched = []
    two_months_ago = datetime.now() - timedelta(days=60)

    for ad in ads_data:
        start_date_str = ad.get("ad_delivery_start_time") or ad.get("ad_creation_time", "")
        try:
            start_date = datetime.strptime(start_date_str[:10], "%Y-%m-%d")
            days_running = (datetime.now() - start_date).days
            running_2_months = start_date <= two_months_ago
        except Exception:
            days_running = 0
            running_2_months = False

        bodies = ad.get("ad_creative_bodies", [])
        titles = ad.get("ad_creative_link_titles", [])
        descriptions = ad.get("ad_creative_link_descriptions", [])
        full_text = " ".join(bodies + titles + descriptions)

        category = categorize_ad(full_text)
        keywords = extract_keywords(full_text)[:10]

        spend = ad.get("spend", {})
        impressions = ad.get("impressions", {})

        enriched.append({
            "id": ad.get("id"),
            "page_name": ad.get("page_name", "Unknown"),
            "page_id": ad.get("page_id", ""),
            "ad_body": bodies[0] if bodies else "",
            "ad_title": titles[0] if titles else "",
            "ad_description": descriptions[0] if descriptions else "",
            "ad_snapshot_url": ad.get("ad_snapshot_url", ""),
            "start_date": start_date_str[:10] if start_date_str else "",
            "days_running": days_running,
            "running_2_months": running_2_months,
            "category": category,
            "keywords": keywords,
            "spend_lower": spend.get("lower_bound", "N/A") if isinstance(spend, dict) else "N/A",
            "spend_upper": spend.get("upper_bound", "N/A") if isinstance(spend, dict) else "N/A",
            "impressions_lower": impressions.get("lower_bound", "N/A") if isinstance(impressions, dict) else "N/A",
            "impressions_upper": impressions.get("upper_bound", "N/A") if isinstance(impressions, dict) else "N/A",
            "platforms": ad.get("publisher_platforms", []),
            "currency": ad.get("currency", "PKR"),
        })

    return enriched


def compute_trends(ads):
    long_running = [a for a in ads if a["running_2_months"]]

    category_counts = Counter(a["category"] for a in long_running)
    page_counts = Counter(a["page_name"] for a in long_running)
    all_keywords = []
    for a in long_running:
        all_keywords.extend(a["keywords"])
    keyword_counts = Counter(all_keywords)

    return {
        "total_ads": len(ads),
        "long_running_count": len(long_running),
        "top_categories": category_counts.most_common(8),
        "top_advertisers": page_counts.most_common(10),
        "trending_keywords": keyword_counts.most_common(20),
    }


@app.route("/api/search", methods=["POST"])
def search_ads():
    data = request.json
    access_token = data.get("access_token", "").strip()
    search_terms = data.get("search_terms", "").strip()
    ad_type = data.get("ad_type", "ALL")
    limit = min(int(data.get("limit", 50)), 200)
    filter_long_running = data.get("filter_long_running", False)

    if not access_token:
        return jsonify({"error": "Facebook Access Token is required"}), 400

    result = fetch_ads(access_token, search_terms, ad_type, limit)

    if "error" in result:
        return jsonify({"error": result["error"].get("message", "API error")}), 400

    ads = result.get("data", [])
    enriched = enrich_ads(ads)

    if filter_long_running:
        enriched = [a for a in enriched if a["running_2_months"]]

    trends = compute_trends(enriched if not filter_long_running else enrich_ads(result.get("data", [])))

    return jsonify({
        "ads": enriched,
        "trends": trends,
        "paging": result.get("paging", {}),
        "search_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "cutoff_date": get_two_months_ago(),
    })


@app.route("/api/trending", methods=["POST"])
def get_trending():
    data = request.json
    access_token = data.get("access_token", "").strip()

    if not access_token:
        return jsonify({"error": "Facebook Access Token is required"}), 400

    categories_data = {}
    for category, keywords in list(CATEGORY_KEYWORDS.items())[:5]:
        search_term = keywords[0]
        result = fetch_ads(access_token, search_term, limit=30)
        ads = result.get("data", [])
        enriched = enrich_ads(ads)
        long_running = [a for a in enriched if a["running_2_months"]]
        if long_running:
            categories_data[category] = long_running[:5]

    return jsonify({"trending_by_category": categories_data})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
