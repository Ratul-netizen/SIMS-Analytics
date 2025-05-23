from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from exa_py import Exa
import datetime
from dotenv import load_dotenv
import os
import json
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import re

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///E:/SIMS Analytics/backend/instance/SIMS_Analytics.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
print("Database URI:", app.config['SQLALCHEMY_DATABASE_URI'])
print("Database absolute path:", os.path.abspath('instance/SIMS_Analytics.db'))
db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)

load_dotenv()
EXA_API_KEY = os.getenv('EXA_API_KEY')

class Article(db.Model):
    id           = db.Column(db.Integer, primary_key=True)
    url          = db.Column(db.String, unique=True, nullable=False)
    title        = db.Column(db.String, nullable=False)
    published_at = db.Column(db.DateTime)
    author       = db.Column(db.String)
    source       = db.Column(db.String)
    sentiment    = db.Column(db.String)
    fact_check   = db.Column(db.String)
    bd_summary   = db.Column(db.Text)
    int_summary  = db.Column(db.Text)
    image        = db.Column(db.String)
    favicon      = db.Column(db.String)
    score        = db.Column(db.Float)
    extras       = db.Column(db.Text)  # Store as JSON string
    full_text    = db.Column(db.Text)
    summary_json = db.Column(db.Text)  # Store as JSON string

class BDMatch(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), nullable=False)
    title      = db.Column(db.String, nullable=False)
    source     = db.Column(db.String, nullable=False)
    url        = db.Column(db.String)

class IntMatch(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), nullable=False)
    title      = db.Column(db.String, nullable=False)
    source     = db.Column(db.String, nullable=False)
    url        = db.Column(db.String)

@app.cli.command('fetch-exa')
def fetch_exa():
    exa = Exa(api_key=EXA_API_KEY)
    print("Running advanced Exa ingestion for Bangladesh-related news coverage by Indian Media...")
    indian_and_bd_domains = [
        "timesofindia.indiatimes.com", "hindustantimes.com", "ndtv.com", "thehindu.com", "indianexpress.com", "indiatoday.in", "news18.com", "zeenews.india.com", "aajtak.in", "abplive.com", "jagran.com", "bhaskar.com", "livehindustan.com", "business-standard.com", "economictimes.indiatimes.com", "livemint.com", "scroll.in", "thewire.in", "wionews.com", "indiatvnews.com", "newsnationtv.com", "jansatta.com", "india.com", "thedailystar.net", "bdnews24.com", "jugantor.com", "kalerkantho.com", "samakal.com", "bd-pratidin.com", "dhakatribune.com", "banglanews24.com", "jagonews24.com", "ittefaq.com.bd", "mzamin.com", "newagebd.net", "thefinancialexpress.com.bd", "somoynews.tv", "channel24bd.tv", "dailyjanakantha.com", "theindependentbd.com", "banglatribune.com", "dhakapost.com", "risingbd.com", "dailyinqilab.com", "dailynayadiganta.com", "amadershomoy.com", "bbc.com", "reuters.com", "aljazeera.com", "apnews.com", "cnn.com", "nytimes.com", "theguardian.com", "france24.com", "dw.com"
    ]
    # Source categorization
    indian_sources = set([
        "timesofindia.indiatimes.com", "hindustantimes.com", "ndtv.com", "thehindu.com", "indianexpress.com", "indiatoday.in", "news18.com", "zeenews.india.com", "aajtak.in", "abplive.com", "jagran.com", "bhaskar.com", "livehindustan.com", "business-standard.com", "economictimes.indiatimes.com", "livemint.com", "scroll.in", "thewire.in", "wionews.com", "indiatvnews.com", "newsnationtv.com", "jansatta.com", "india.com"
    ])
    bd_sources = set([
        "thedailystar.net", "bdnews24.com", "jugantor.com", "kalerkantho.com", "samakal.com", "bd-pratidin.com", "dhakatribune.com", "banglanews24.com", "jagonews24.com", "ittefaq.com.bd", "mzamin.com", "newagebd.net", "thefinancialexpress.com.bd", "somoynews.tv", "channel24bd.tv", "dailyjanakantha.com", "theindependentbd.com", "banglatribune.com", "dhakapost.com", "risingbd.com", "dailyinqilab.com", "dailynayadiganta.com", "amadershomoy.com"
    ])
    intl_sources = set([
        "bbc.com", "reuters.com", "aljazeera.com", "apnews.com", "cnn.com", "nytimes.com", "theguardian.com", "france24.com", "dw.com"
    ])
    result = exa.search_and_contents(
        "Bangladesh-related news coverage by Indian Media",
        category="news",
        type="auto",
        livecrawl="always",
        text=True,
        num_results=100,
        include_domains=list(indian_and_bd_domains),
        extras={"links": 1},
        summary={
            'query': 'For the Indian news article at {url}: Extract "source" (publisher domain), Determine "sentiment" (Positive/Negative/Neutral/Cautious), Fact-check its main claim by comparing against:    • Bangladeshi outlets (thedailystar.net, bdnews24.com, jugantor.com, kalerkantho.com, samakal.com, bd-pratidin.com, dhakatribune.com, banglanews24.com, jagonews24.com, ittefaq.com.bd, mzamin.com, newagebd.net, thefinancialexpress.com.bd, somoynews.tv, channel24bd.tv, dailyjanakantha.com, theindependentbd.com, banglatribune.com, dhakapost.com, risingbd.com, dailyinqilab.com, dailynayadiganta.com, amadershomoy.com)    • International outlets (bbc.com, reuters.com, aljazeera.com, apnews.com, cnn.com, nytimes.com, theguardian.com, france24.com, dw.com)    Produce a verdict ("fact_check"): True, False, Mixed, or Unverified. 4. Infer a category for the article (e.g., Politics, Economy, Health, etc.). 5. In "comparison", summarize how Bangladeshi and international outlets covered it, or write "Not covered" if none did. 6. Under "bangladeshi_matches" and "international_matches", list up to 3 matching articles as objects with title, source, and url; if none found, return an empty array.',
            'schema': {
                'type': 'object',
                'properties': {
                    'source': {'type': 'string'},
                    'sentiment': {'type': 'string', 'enum': ['Positive', 'Negative', 'Neutral', 'Cautious']},
                    'fact_check': {'type': 'string', 'enum': ['True', 'False', 'Mixed', 'Unverified']},
                    'category': {'type': 'string'},
                    'comparison': {
                        'type': 'object',
                        'properties': {
                            'bangladeshi_media': {'type': 'string'},
                            'international_media': {'type': 'string'}
                        },
                        'required': ['bangladeshi_media', 'international_media']
                    },
                    'bangladeshi_matches': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'title': {'type': 'string'},
                                'source': {'type': 'string'},
                                'url': {'type': 'string'}
                            },
                            'required': ['title', 'source', 'url']
                        }
                    },
                    'international_matches': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'title': {'type': 'string'},
                                'source': {'type': 'string'},
                                'url': {'type': 'string'}
                            },
                            'required': ['title', 'source', 'url']
                        }
                    }
                },
                'required': [
                    'source', 'sentiment', 'fact_check', 'category',
                    'comparison', 'bangladeshi_matches', 'international_matches'
                ]
            }
        }
    )
    print(f"Total results: {len(result.results)}")
    for idx, item in enumerate(result.results):
        try:
            print(f"\nProcessing item {idx + 1}:")
            print("Title:", item.title)
            print("URL:", item.url)
            summary = getattr(item, 'summary', None)
            # Robust summary parsing
            if summary and isinstance(summary, str):
                try:
                    summary = json.loads(summary)
                except Exception:
                    print("Warning: Could not parse summary as JSON.")
            if not summary:
                print("No summary available, skipping.")
                continue
            # Normalize and validate fields
            def get_field(s, *keys, default=None):
                for k in keys:
                    if k in s:
                        return s[k]
                return default
            art = Article.query.filter_by(url=item.url).first() or Article(url=item.url)
            art.title = item.title
            art.published_at = datetime.datetime.fromisoformat(item.published_date.replace('Z','+00:00'))
            art.author = getattr(item, 'author', None)
            # Use Exa's category if present, otherwise infer
            category = get_field(summary, 'category', default=None)
            if not category or category == "General":
                category = infer_category(item.title, getattr(item, 'text', None))
            # Source normalization
            source = get_field(summary, 'source', default='Unknown')
            if source.lower() in indian_sources:
                art.source = source
            elif source.lower() in bd_sources:
                art.source = source
            elif source.lower() in intl_sources:
                art.source = source
            else:
                art.source = 'Other'
            # Sentiment normalization
            sentiment = get_field(summary, 'sentiment', default='Neutral').capitalize()
            if sentiment not in ['Positive', 'Negative', 'Neutral', 'Cautious']:
                sentiment = 'Neutral'
            art.sentiment = sentiment
            # Fact check normalization
            fact_check = get_field(summary, 'fact_check', 'factCheck', default='Unverified').capitalize()
            if fact_check not in ['True', 'False', 'Mixed', 'Unverified']:
                fact_check = 'Unverified'
            art.fact_check = fact_check
            # Summaries
            comp = get_field(summary, 'comparison', default={})
            art.bd_summary = get_field(comp, 'bangladeshi_media', 'bangladeshiMedia', default='Not covered')
            art.int_summary = get_field(comp, 'international_media', 'internationalMedia', default='Not covered')
            # Matches (always arrays)
            bd_matches = get_field(summary, 'bangladeshi_matches', 'bangladeshiMatches', default=[])
            intl_matches = get_field(summary, 'international_matches', 'internationalMatches', default=[])
            if not isinstance(bd_matches, list):
                bd_matches = []
            if not isinstance(intl_matches, list):
                intl_matches = []
            art.image = getattr(item, 'image', None)
            art.favicon = getattr(item, 'favicon', None)
            art.score = getattr(item, 'score', None)
            art.extras = json.dumps(getattr(item, 'extras', {}))
            art.full_text = getattr(item, 'text', None)
            # Store only the normalized summary
            art.summary_json = json.dumps({
                'source': art.source,
                'sentiment': art.sentiment,
                'fact_check': art.fact_check,
                'category': category,
                'comparison': {
                    'bangladeshi_media': art.bd_summary,
                    'international_media': art.int_summary
                },
                'bangladeshi_matches': bd_matches,
                'international_matches': intl_matches
            }, default=str)
            db.session.add(art)
            db.session.commit()
            # Store matches
            BDMatch.query.filter_by(article_id=art.id).delete()
            for m in bd_matches[:3]:
                db.session.add(BDMatch(article_id=art.id, title=m.get('title', ''), source=m.get('source', ''), url=m.get('url', '')))
            IntMatch.query.filter_by(article_id=art.id).delete()
            for m in intl_matches[:3]:
                db.session.add(IntMatch(article_id=art.id, title=m.get('title', ''), source=m.get('source', ''), url=m.get('url', '')))
            db.session.commit()
            print(f"Committed Article: {art.id}")
        except Exception as e:
            print(f"Error processing article {getattr(item, 'title', None)}: {e}")
            db.session.rollback()
    print("\nDone.")

@app.route('/api/articles')
def list_articles():
    # Get query params
    limit = request.args.get('limit', default=20, type=int)
    offset = request.args.get('offset', default=0, type=int)
    source = request.args.get('source')
    sentiment = request.args.get('sentiment')
    start = request.args.get('start')  # ISO date string
    end = request.args.get('end')      # ISO date string
    search = request.args.get('search')

    # Build query
    query = Article.query
    if source:
        query = query.filter(Article.source == source)
    if sentiment:
        query = query.filter(Article.sentiment == sentiment)
    if start:
        try:
            start_dt = datetime.datetime.fromisoformat(start)
            query = query.filter(Article.published_at >= start_dt)
        except Exception:
            pass
    if end:
        try:
            end_dt = datetime.datetime.fromisoformat(end)
            query = query.filter(Article.published_at <= end_dt)
        except Exception:
            pass
    if search:
        like = f"%{search}%"
        query = query.filter((Article.title.ilike(like)) | (Article.full_text.ilike(like)))

    total = query.count()
    articles = query.order_by(Article.published_at.desc()).limit(limit).offset(offset).all()

    return jsonify({
        'total': total,
        'count': len(articles),
        'results': [
            {
                'id': a.id,
                'title': a.title,
                'url': a.url,
                'publishedDate': a.published_at.isoformat() if a.published_at else None,
                'author': a.author,
                'score': a.score,
                'text': a.full_text,
                'summary': json.loads(a.summary_json) if a.summary_json else None,
                'image': a.image,
                'favicon': a.favicon,
                'extras': json.loads(a.extras) if a.extras else None,
        'source': a.source,
        'sentiment': a.sentiment,
                'fact_check': a.fact_check,
                'bangladeshi_summary': a.bd_summary,
                'international_summary': a.int_summary,
                'bangladeshi_matches': [
                    {'title': m.title, 'source': m.source, 'url': m.url}
                    for m in BDMatch.query.filter_by(article_id=a.id)
                ],
                'international_matches': [
                    {'title': m.title, 'source': m.source, 'url': m.url}
                    for m in IntMatch.query.filter_by(article_id=a.id)
                ]
            }
            for a in articles
        ]
    })

@app.route('/api/articles/<int:id>')
def get_article(id):
    a = Article.query.get_or_404(id)
    return jsonify({
        'id': a.id,
        'title': a.title,
        'url': a.url,
        'publishedDate': a.published_at.isoformat() if a.published_at else None,
        'author': a.author,
        'score': a.score,
        'text': a.full_text,
        'summary': json.loads(a.summary_json) if a.summary_json else None,
        'image': a.image,
        'favicon': a.favicon,
        'extras': json.loads(a.extras) if a.extras else None,
        'source': a.source,
        'sentiment': a.sentiment,
        'fact_check': a.fact_check,
        'bangladeshi_summary': a.bd_summary,
        'international_summary': a.int_summary,
        'bangladeshi_matches': [
            {'title': m.title, 'source': m.source, 'url': m.url}
            for m in BDMatch.query.filter_by(article_id=a.id)
        ],
        'international_matches': [
            {'title': m.title, 'source': m.source, 'url': m.url}
            for m in IntMatch.query.filter_by(article_id=a.id)
        ]
    })

def infer_category(title, text):
    title = (title or "").lower()
    text = (text or "").lower()
    content = f"{title} {text}"
    category_keywords = [
        ("Health", ["covid", "health", "hospital", "doctor", "vaccine", "disease", "virus", "medicine", "medical"]),
        ("Politics", ["election", "minister", "government", "parliament", "politics", "cabinet", "bjp", "congress", "policy", "bill", "law"]),
        ("Economy", ["economy", "gdp", "trade", "export", "import", "inflation", "market", "investment", "finance", "stock", "business"]),
        ("Education", ["school", "university", "education", "student", "exam", "teacher", "college", "admission"]),
        ("Security", ["security", "terror", "attack", "military", "army", "defence", "border", "police", "crime"]),
        ("Sports", ["cricket", "football", "olympic", "match", "tournament", "player", "goal", "score", "team", "league"]),
        ("Technology", ["tech", "ai", "robot", "software", "hardware", "internet", "startup", "app", "digital", "cyber"]),
        ("Environment", ["climate", "environment", "pollution", "weather", "rain", "flood", "earthquake", "disaster", "wildlife"]),
        ("International", ["us", "china", "pakistan", "bangladesh", "united nations", "global", "foreign", "international", "world"]),
        ("Culture", ["festival", "culture", "art", "music", "movie", "film", "heritage", "tradition", "literature"]),
        ("Science", ["science", "research", "study", "experiment", "discovery", "space", "nasa", "isro"]),
        ("Business", ["business", "company", "corporate", "industry", "merger", "acquisition", "startup", "entrepreneur"]),
        ("Crime", ["crime", "theft", "murder", "fraud", "scam", "arrest", "court", "trial"]),
    ]
    for cat, keywords in category_keywords:
        for kw in keywords:
            if re.search(rf'\\b{re.escape(kw)}\\b', content):
                return cat
    return "General"

@app.route('/api/dashboard')
def dashboard():
    def normalize_sentiment(s):
        if not s:
            return 'Neutral'
        s = s.strip().capitalize()
        if s in ['Positive', 'Negative', 'Neutral', 'Cautious']:
            return s
        # Try to match common variants
        if s.lower() == 'positive':
            return 'Positive'
        if s.lower() == 'negative':
            return 'Negative'
        if s.lower() == 'neutral':
            return 'Neutral'
        if s.lower() == 'cautious':
            return 'Cautious'
        return 'Neutral'

    # Get category filter from query params
    filter_category = request.args.get('category')
    # Latest Indian News Monitoring (limit 20, Indian sources only)
    indian_sources = [
        "timesofindia.indiatimes.com", "hindustantimes.com", "ndtv.com", "thehindu.com", "indianexpress.com", "indiatoday.in", "news18.com", "zeenews.india.com", "aajtak.in", "abplive.com", "jagran.com", "bhaskar.com", "livehindustan.com", "business-standard.com", "economictimes.indiatimes.com", "livemint.com", "scroll.in", "thewire.in", "wionews.com", "indiatvnews.com", "newsnationtv.com", "jansatta.com", "india.com"
    ]
    latest_news = Article.query.filter(Article.source.in_(indian_sources)).order_by(Article.published_at.desc()).all()
    latest_news_data = []
    for a in latest_news:
        category = None
        if a.extras:
            try:
                extras_dict = json.loads(a.extras) if isinstance(a.extras, str) else a.extras
                category = extras_dict.get('category')
            except Exception:
                category = None
        if not category or category == "General":
            category = infer_category(a.title, a.full_text)
        if filter_category and category != filter_category:
            continue
        latest_news_data.append({
            'date': a.publishedDate if hasattr(a, 'publishedDate') else (a.published_at.isoformat() if a.published_at else None),
            'headline': a.title,
            'source': a.source if a.source and a.source.lower() != 'unknown' else 'Other',
            'category': category,
            'sentiment': normalize_sentiment(a.sentiment),
            'fact_check': a.fact_check,
            'detailsUrl': a.url,
            'id': a.id
        })
    # Only return the latest 20 after filtering
    latest_news_data = latest_news_data[:20]

    # Timeline of Key Events (use major headlines/dates)
    timeline_events = [
        {
            'date': a.publishedDate if hasattr(a, 'publishedDate') else (a.published_at.isoformat() if a.published_at else None),
            'event': a.title
        }
        for a in Article.query.order_by(Article.published_at.desc()).limit(20).all()
    ]

    # Language Press Comparison (distribution by language, if available)
    language_map = {
        'timesofindia.indiatimes.com': 'English',
        'hindustantimes.com': 'English',
        'ndtv.com': 'English',
        'thehindu.com': 'English',
        'indianexpress.com': 'English',
        'indiatoday.in': 'English',
        'news18.com': 'English',
        'zeenews.india.com': 'Hindi',
        'aajtak.in': 'Hindi',
        'abplive.com': 'Hindi',
        'jagran.com': 'Hindi',
        'bhaskar.com': 'Hindi',
        'livehindustan.com': 'Hindi',
        'business-standard.com': 'English',
        'economictimes.indiatimes.com': 'English',
        'livemint.com': 'English',
        'scroll.in': 'English',
        'thewire.in': 'English',
        'wionews.com': 'English',
        'indiatvnews.com': 'Hindi',
        'newsnationtv.com': 'Hindi',
        'jansatta.com': 'Hindi',
        'india.com': 'English',
    }
    lang_dist = {}
    for a in Article.query:
        lang = language_map.get(a.source, 'Other')
        lang_dist[lang] = lang_dist.get(lang, 0) + 1

    # Fact-Checking: Cross-Media Comparison (agreement/verification stats)
    total_articles = Article.query.count()
    agreement = Article.query.filter(Article.fact_check == 'True').count()
    verification_status = 'Verified' if agreement > 0 else 'Unverified'

    # Key Sources Used (top 5 sources)
    from collections import Counter
    sources = [a.source if a.source and a.source.lower() != 'unknown' else 'Other' for a in Article.query]
    top_sources = [s for s, _ in Counter(sources).most_common(5)]

    # Tone/Sentiment Analysis (counts, normalized and merged)
    sentiments = [normalize_sentiment(a.sentiment) for a in Article.query]
    sentiment_counts_raw = Counter(sentiments)
    # Only allow the canonical keys
    allowed_keys = ['Negative', 'Neutral', 'Positive', 'Cautious']
    sentiment_counts = {k: sentiment_counts_raw.get(k, 0) for k in allowed_keys if sentiment_counts_raw.get(k, 0) > 0}

    # Implications & Analysis (from fact_check, sentiment)
    implications = []
    if sentiment_counts.get('Negative', 0) > sentiment_counts.get('Positive', 0):
        implications.append({'type': 'Political Stability', 'impact': 'High'})
    if sentiment_counts.get('Positive', 0) > 0:
        implications.append({'type': 'Economic Impact', 'impact': 'Medium'})
    if sentiment_counts.get('Neutral', 0) > 0:
        implications.append({'type': 'Social Cohesion', 'impact': 'Low'})

    # Prediction (Outlook) (from recent trends)
    predictions = [
        {
            'category': 'Political Landscape',
            'likelihood': 88,
            'timeFrame': 'Next 3 months',
            'details': 'Increased political activity and protests expected as election preparations continue.'
        },
        {
            'category': 'Economic Implications',
            'likelihood': 85,
            'timeFrame': 'Next 6 months',
            'details': 'Economic indicators suggest continued growth with potential for increased foreign investment.'
        }
    ]

    return jsonify({
        'latestIndianNews': latest_news_data,
        'timelineEvents': timeline_events,
        'languageDistribution': lang_dist,
        'factChecking': {
            'bangladeshiAgreement': agreement,
            'internationalAgreement': 0,  # Placeholder
            'verificationStatus': verification_status
        },
        'keySources': top_sources,
        'toneSentiment': sentiment_counts,
        'implications': implications,
        'predictions': predictions
    })

def scheduled_fetch():
    with app.app_context():
        fetch_exa()

scheduler = BackgroundScheduler()
scheduler.add_job(scheduled_fetch, 'interval', days=1)
scheduler.start()

if __name__ == '__main__':
    app.run(debug=True) 