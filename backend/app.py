from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from exa_py import Exa
import datetime
from dotenv import load_dotenv
import os
import json
from flask_cors import CORS

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
    result = exa.search_and_contents(
        "Bangladesh-related news coverage by Indian Media",
        category="news",
        type="auto",
        livecrawl="always",
        text=True,
        num_results=100,
        include_domains=indian_and_bd_domains,
        extras={"links": 1},
        summary={
            'query': 'For the Indian news article at {url}: Extract "source" (publisher domain), Determine "sentiment" (Positive/Negative/Neutral), Fact-check its main claim by comparing against:    • Bangladeshi outlets (thedailystar.net, bdnews24.com, jugantor.com, kalerkantho.com, samakal.com, bd-pratidin.com, dhakatribune.com, banglanews24.com, jagonews24.com, ittefaq.com.bd, mzamin.com, newagebd.net, thefinancialexpress.com.bd, somoynews.tv, channel24bd.tv, dailyjanakantha.com, theindependentbd.com, banglatribune.com, dhakapost.com, risingbd.com, dailyinqilab.com, dailynayadiganta.com, amadershomoy.com)    • International outlets (bbc.com, reuters.com, aljazeera.com, apnews.com, cnn.com, nytimes.com, theguardian.com, france24.com, dw.com)    Produce a verdict ("factCheck"): True, False, or Mixed. 4. In "bangladeshiMedia", summarize how Bangladeshi outlets covered it, or write "Not covered" if none did. 5. In "internationalMedia", summarize how international outlets covered it, or write "Not covered" if none did. 6. Under "bangladeshiMatches", list up to 3 matching BD articles as objects with title, source, and url; if none found, return an empty array. 7. Under "internationalMatches", list up to 3 matching international articles similarly; if none found, return an empty array.',
            'schema': {
                'summary': {
                    'prompt': 'For the Indian news article at {url}:\n1. Extract "source" (publisher domain).\n2. Determine "sentiment" (Positive/Negative/Neutral).\n3. Fact-check its main claim by comparing against:\n   • Bangladeshi outlets (thedailystar.net, bdnews24.com, jugantor.com, kalerkantho.com, samakal.com, bd-pratidin.com, dhakatribune.com, banglanews24.com, jagonews24.com, ittefaq.com.bd, mzamin.com, newagebd.net, thefinancialexpress.com.bd, somoynews.tv, channel24bd.tv, dailyjanakantha.com, theindependentbd.com, banglatribune.com, dhakapost.com, risingbd.com, dailyinqilab.com, dailynayadiganta.com, amadershomoy.com)\n   • International outlets (bbc.com, reuters.com, aljazeera.com, apnews.com, cnn.com, nytimes.com, theguardian.com, france24.com, dw.com)\n   Produce a verdict ("factCheck"): True, False, or Mixed.\n4. In "bangladeshiMedia", summarize how Bangladeshi outlets covered it, or write "Not covered" if none did.\n5. In "internationalMedia", summarize how international outlets covered it, or write "Not covered" if none did.\n6. Under "bangladeshiMatches", list up to 3 matching BD articles as objects with title, source, and url; if none found, return an empty array.\n7. Under "internationalMatches", list up to 3 matching international articles similarly; if none found, return an empty array.',
                    'stringify': False,
                    'schema': {
                        'type': 'object',
                        'properties': {
                            'source': {'type': 'string', 'description': 'Indian publisher domain'},
                            'sentiment': {'type': 'string', 'description': 'Overall sentiment (Positive, Negative, Neutral)'},
                            'fact_check': {'type': 'string', 'description': 'Verdict after comparison (True, False, Mixed)'},
                            'comparison': {
                                'type': 'object',
                                'properties': {
                                    'bangladeshi_media': {'type': 'string', 'description': "Summary of BD coverage or 'Not covered'"},
                                    'international_media': {'type': 'string', 'description': "Summary of Intl coverage or 'Not covered'"}
                                },
                                'required': ['bangladeshi_media', 'international_media']
                            },
                            'bangladeshi_matches': {
                                'type': 'array',
                                'description': 'List of BD articles used for comparison (0–3 items)',
                                'min_items': 0,
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'title': {'type': 'string'},
                                        'source': {'type': 'string'},
                                        'url': {'type': 'string', 'format': 'uri'}
                                    },
                                    'required': ['title', 'source']
                                }
                            },
                            'international_matches': {
                                'type': 'array',
                                'description': 'List of Intl articles used for comparison (0–3 items)',
                                'min_items': 0,
                                'items': {
                                    'type': 'object',
                                    'properties': {
                                        'title': {'type': 'string'},
                                        'source': {'type': 'string'},
                                        'url': {'type': 'string', 'format': 'uri'}
                                    },
                                    'required': ['title', 'source']
                                }
                            }
                        },
                        'required': ['source', 'sentiment', 'fact_check', 'comparison', 'bangladeshi_matches', 'international_matches']
                    }
                }
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
            art = Article.query.filter_by(url=item.url).first() or Article(url=item.url)
            art.title = item.title
            art.published_at = datetime.datetime.fromisoformat(item.published_date.replace('Z','+00:00'))
            art.author = getattr(item, 'author', None)
            # Extract fields from summary dict, fallback to defaults
            if isinstance(summary, dict):
                art.source = summary.get('source', 'Unknown')
                art.sentiment = summary.get('sentiment', 'neutral')
                art.fact_check = summary.get('fact_check', 'unverified')
                comp = summary.get('comparison', {})
                art.bd_summary = comp.get('bangladeshi_media') if comp else None
                art.int_summary = comp.get('international_media') if comp else None
                bd_matches = summary.get('bangladeshi_matches', [])
                intl_matches = summary.get('international_matches', [])
            elif isinstance(summary, list) and summary and isinstance(summary[0], dict):
                # Sometimes summary is a list of dicts
                s = summary[0]
                art.source = s.get('source', 'Unknown')
                art.sentiment = s.get('sentiment', 'neutral')
                art.fact_check = s.get('factCheck', 'unverified')
                art.bd_summary = s.get('bangladeshiMedia')
                art.int_summary = s.get('internationalMedia')
                bd_matches = s.get('bangladeshiMatches', [])
                intl_matches = s.get('internationalMatches', [])
            else:
                art.source = 'Unknown'
                art.sentiment = 'neutral'
                art.fact_check = 'unverified'
                art.bd_summary = None
                art.int_summary = None
                bd_matches = []
                intl_matches = []
            art.image = getattr(item, 'image', None)
            art.favicon = getattr(item, 'favicon', None)
            art.score = getattr(item, 'score', None)
            art.extras = json.dumps(getattr(item, 'extras', {}))
            art.full_text = getattr(item, 'text', None)
            art.summary_json = json.dumps(summary, default=str) if summary else None
            db.session.add(art)
            db.session.commit()
            # Store matches
            BDMatch.query.filter_by(article_id=art.id).delete()
            for m in bd_matches[:3]:
                db.session.add(BDMatch(article_id=art.id, **m))
            IntMatch.query.filter_by(article_id=art.id).delete()
            for m in intl_matches[:3]:
                db.session.add(IntMatch(article_id=art.id, **m))
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

if __name__ == '__main__':
    app.run(debug=True) 