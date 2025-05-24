"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { FaUser, FaCalendarAlt, FaGlobe, FaLink, FaChevronLeft, FaRegNewspaper, FaCheckCircle, FaExclamationCircle, FaQuestionCircle, FaArrowRight, FaNewspaper } from "react-icons/fa";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const sentimentColor = {
  Positive: "bg-green-100 text-green-700 border-green-300",
  Negative: "bg-red-100 text-red-700 border-red-300",
  Neutral: "bg-gray-100 text-gray-700 border-gray-300",
  Cautious: "bg-yellow-100 text-yellow-700 border-yellow-300",
};
const factCheckColor = {
  True: "bg-green-100 text-green-700 border-green-300",
  False: "bg-red-100 text-red-700 border-red-300",
  Mixed: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Unverified: "bg-gray-100 text-gray-700 border-gray-300",
};
const categoryColor = {
  Health: "bg-green-100 text-green-700 border-green-300",
  Politics: "bg-blue-100 text-blue-700 border-blue-300",
  Economy: "bg-yellow-100 text-yellow-700 border-yellow-300",
  Education: "bg-purple-100 text-purple-700 border-purple-300",
  Security: "bg-red-100 text-red-700 border-red-300",
  Sports: "bg-indigo-100 text-indigo-700 border-indigo-300",
  Technology: "bg-pink-100 text-pink-700 border-pink-300",
  Environment: "bg-emerald-100 text-emerald-700 border-emerald-300",
  International: "bg-cyan-100 text-cyan-700 border-cyan-300",
  Culture: "bg-orange-100 text-orange-700 border-orange-300",
  Science: "bg-lime-100 text-lime-700 border-lime-300",
  Business: "bg-teal-100 text-teal-700 border-teal-300",
  Crime: "bg-gray-200 text-gray-700 border-gray-300",
  General: "bg-gray-100 text-gray-700 border-gray-300",
};

const sentimentIcon = {
  Positive: <FaCheckCircle className="inline mr-1" />,
  Negative: <FaExclamationCircle className="inline mr-1" />,
  Neutral: <FaRegNewspaper className="inline mr-1" />,
  Cautious: <FaQuestionCircle className="inline mr-1" />,
};
const factCheckIcon = {
  True: <FaCheckCircle className="inline mr-1" />,
  False: <FaExclamationCircle className="inline mr-1" />,
  Mixed: <FaQuestionCircle className="inline mr-1" />,
  Unverified: <FaRegNewspaper className="inline mr-1" />,
};

export default function NewsDetail() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios.get(`/api/articles/${id}`)
      .then(res => setData(res.data))
      .catch(() => setError("Failed to load article."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (error || !data) return <div className="flex items-center justify-center min-h-screen text-red-600">{error || "No data found."}</div>;

  const summary = data.summary || {};
  const extras = data.extras || {};
  const links = extras.links || [];
  const cat = (summary.category || "General") as keyof typeof categoryColor;
  const sent = (data.sentiment || "Neutral") as keyof typeof sentimentColor;
  const fact = (data.fact_check || "Unverified") as keyof typeof factCheckColor;

  const matchesSection = (title: string, matches: any[]) => (
    <div className="mb-4">
      <div className="font-semibold mb-1">{title}</div>
      {matches.length === 0 ? (
        <div className="text-gray-400 text-sm italic">None</div>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {matches.map((m, i) => (
            <li key={i}>
              <a href={m.url} className="text-primary-600 underline hover:text-primary-800 transition" target="_blank" rel="noopener noreferrer">{m.title}</a>
              <span className="ml-2 text-xs text-gray-500">({m.source})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="animate-fadein">
      <div className="max-w-4xl mx-auto px-2 md:px-6 py-8">
        <div className="flex gap-4 mb-6">
          <button className="flex items-center gap-2 px-5 py-2 rounded bg-primary-600 text-white font-semibold hover:bg-primary-700 shadow transition" onClick={() => router.push("/")}> <FaChevronLeft /> Back to Dashboard</button>
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow transition"
            >
              <FaLink /> View Original
            </a>
          )}
        </div>
        <div className="rounded-xl shadow-lg bg-white overflow-hidden mb-8">
          {/* Header with image background */}
          <div className="relative h-48 md:h-64 flex items-end bg-gray-100">
            {data.image && (
              <img src={data.image} alt="news" className="absolute inset-0 w-full h-full object-cover object-center opacity-70" />
            )}
            <div className="relative z-10 p-6 w-full bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {data.favicon && <img src={data.favicon} alt="favicon" className="w-6 h-6 rounded inline-block" />}
                <span className="text-white font-semibold text-lg flex items-center gap-1"><FaGlobe /> {data.source}</span>
                <span className={`px-2 py-1 rounded border text-xs font-semibold ${categoryColor[cat]}`}>{summary.category || "General"}</span>
                <span className={`px-2 py-1 rounded border text-xs font-semibold flex items-center gap-1 ${sentimentColor[sent]}`}>{sentimentIcon[sent]}{data.sentiment}</span>
                <span className={`px-2 py-1 rounded border text-xs font-semibold flex items-center gap-1 ${factCheckColor[fact]}`}>{factCheckIcon[fact]}{data.fact_check}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow mb-1">{data.title}</h1>
              <div className="flex flex-wrap gap-4 items-center text-gray-200 text-sm">
                <span className="flex items-center gap-1"><FaUser /> {data.author || "Unknown"}</span>
                <span className="flex items-center gap-1"><FaCalendarAlt /> {data.publishedDate ? format(new Date(data.publishedDate), "MMM d, yyyy") : "-"}</span>
                {links.length > 0 && (
                  <span className="flex items-center gap-1"><FaLink />
                    {links.map((l: string, i: number) => {
                      let display = l.replace(/^https?:\/\//, '').replace(/\/$/, '');
                      if (display.length > 40) display = display.slice(0, 37) + '...';
                      return (
                        <a
                          key={i}
                          href={l}
                          className="underline hover:text-primary-200 transition mr-2"
                          target="_blank"
                          rel="noopener noreferrer"
                          title={l}
                        >
                          {display}
                        </a>
                      );
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Main content */}
          <div className="p-6 md:p-8">
            {/* Executive Summary */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <FaRegNewspaper className="text-yellow-500 text-xl" />
                <span className="font-bold text-lg">Executive Summary</span>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm whitespace-pre-line text-gray-800">
                {data.text}
              </div>
            </div>
            {/* Two-column layout for summaries and metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <div className="font-semibold mb-1 text-primary-700">Bangladeshi Media Summary</div>
                <div className="mb-2 text-gray-700">{data.bangladeshi_summary || summary.comparison?.bangladeshi_media || "Not covered"}</div>
                {matchesSection("Bangladeshi Matches", data.bangladeshi_matches || summary.bangladeshi_matches || [])}
              </div>
              <div>
                <div className="font-semibold mb-1 text-primary-700">International Media Summary</div>
                <div className="mb-2 text-gray-700">{data.international_summary || summary.comparison?.international_media || "Not covered"}</div>
                {matchesSection("International Matches", data.international_matches || summary.international_matches || [])}
              </div>
            </div>
            <hr className="my-6 border-gray-200" />
            {/* Score and Extras */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div>
                <div className="font-semibold text-gray-700">Score:</div>
                <div className="text-lg font-mono">{typeof data.score === "number" ? data.score.toFixed(3) : "-"}</div>
              </div>
              {/* Add more metadata or extras here if needed */}
            </div>
          </div>
        </div>
        {/* Related Articles Carousel */}
        {data.summary && data.summary.category && (
          <div className="card mb-8 animate-fadein">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaArrowRight className="text-primary-600" />Related Articles</h2>
            <div className="flex overflow-x-auto gap-4 pb-2">
              {(data.relatedArticles || []).length === 0 ? (
                <div className="text-gray-500">No related articles found.</div>
              ) : (
                (data.relatedArticles || []).map((art: any) => (
                  <a key={art.id} href={`/news/${art.id}`} className="min-w-[220px] max-w-xs bg-gray-50 rounded shadow p-4 hover:bg-primary-50 transition flex flex-col gap-2">
                    <div className="font-bold text-primary-700 truncate">{art.title}</div>
                    <div className="text-xs text-gray-500">{art.source}</div>
                    <div className="flex gap-1 text-xs">
                      <span className={`px-2 py-0.5 rounded ${categoryColor[(art.category as keyof typeof categoryColor) || "General"]}`}>{art.category}</span>
                      <span className={`px-2 py-0.5 rounded ${sentimentColor[(art.sentiment as keyof typeof sentimentColor) || "Neutral"]}`}>{art.sentiment}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sentiment Breakdown Donut Chart */}
        {data.summary && data.summary.sentiment && (
          <div className="card mb-8 animate-fadein">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaRegNewspaper className="text-primary-600" />Sentiment Breakdown</h2>
            <Pie
              data={{
                labels: [data.summary.sentiment],
                datasets: [
                  {
                    data: [1],
                    backgroundColor: [sentimentColor[(data.summary.sentiment as keyof typeof sentimentColor) || "Neutral"] || "#e5e7eb"],
                  },
                ],
              }}
              options={{ plugins: { legend: { display: true, position: "bottom" } } }}
            />
          </div>
        )}

        {/* More from this Source */}
        {data.source && (
          <div className="card mb-8 animate-fadein">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FaNewspaper className="text-primary-600" />More from {data.source}</h2>
            <div className="flex flex-wrap gap-4">
              {(data.moreFromSource || []).length === 0 ? (
                <div className="text-gray-500">No more articles from this source.</div>
              ) : (
                (data.moreFromSource || []).map((art: any) => (
                  <a key={art.id} href={`/news/${art.id}`} className="w-64 bg-gray-50 rounded shadow p-4 hover:bg-primary-50 transition flex flex-col gap-2">
                    <div className="font-bold text-primary-700 truncate">{art.title}</div>
                    <div className="text-xs text-gray-500">{art.publishedDate ? format(new Date(art.publishedDate), "MMM d, yyyy") : "-"}</div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .animate-fadein {
          animation: fadein 0.7s;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
} 