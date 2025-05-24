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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 md:px-10 py-14">
        {/* Header Buttons */}
        <div className="flex justify-between items-center mb-10 gap-8 flex-wrap">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white text-lg font-semibold hover:bg-primary-700 shadow transition" onClick={() => router.push("/")}> <FaChevronLeft /> Back to Dashboard</button>
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-lg font-semibold hover:bg-blue-700 shadow transition"
            >
              <FaLink /> View Original
            </a>
          )}
        </div>
        {/* Header Card */}
        <div className="rounded-3xl shadow-2xl bg-white overflow-hidden mb-14 relative max-w-4xl mx-auto">
          <div className="relative h-64 md:h-80 flex items-end bg-gray-100">
            {data.image && (
              <img src={data.image} alt="news" className="absolute inset-0 w-full h-full object-cover object-center opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-0" />
            <div className="relative z-10 p-10 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {data.favicon && <img src={data.favicon} alt="favicon" className="w-8 h-8 rounded inline-block bg-white p-1" />}
                <span className="text-white font-semibold text-xl flex items-center gap-1"><FaGlobe /> {data.source}</span>
                <span className={`px-3 py-1 rounded border text-sm font-semibold ${categoryColor[cat]}`}>{summary.category || "General"}</span>
                <span className={`px-3 py-1 rounded border text-sm font-semibold flex items-center gap-1 ${sentimentColor[sent]}`}>{sentimentIcon[sent]}{data.sentiment}</span>
                <span className={`px-3 py-1 rounded border text-sm font-semibold flex items-center gap-1 ${factCheckColor[fact]}`}>{factCheckIcon[fact]}{data.fact_check}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-3 leading-tight">{data.title}</h1>
              <div className="flex flex-wrap gap-8 items-center text-gray-200 text-lg">
                <span className="flex items-center gap-2"><FaUser /> {data.author || "Unknown"}</span>
                <span className="flex items-center gap-2"><FaCalendarAlt /> {data.publishedDate ? format(new Date(data.publishedDate), "MMM d, yyyy") : "-"}</span>
                {links.length > 0 && (
                  <span className="flex items-center gap-2"><FaLink />
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
        </div>
        {/* Executive Summary */}
        <div className="mb-14 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FaRegNewspaper className="text-yellow-500 text-3xl" />
            <span className="font-bold text-2xl text-gray-800">Executive Summary</span>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-8 rounded-2xl shadow whitespace-pre-line text-gray-800 text-lg min-h-[120px]">
            {data.text}
          </div>
        </div>
        {/* Two-column layout for summaries and metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-8 min-h-[220px] flex flex-col">
            <div className="font-semibold mb-3 text-primary-700 flex items-center gap-2 text-lg"><FaGlobe className="text-primary-600" />Bangladeshi Media Summary</div>
            <div className="mb-3 text-gray-700 text-base flex-1">{data.bangladeshi_summary || summary.comparison?.bangladeshi_media || "Not covered"}</div>
            {matchesSection("Bangladeshi Matches", data.bangladeshi_matches || summary.bangladeshi_matches || [])}
          </div>
          <div className="bg-white rounded-2xl shadow p-8 min-h-[220px] flex flex-col">
            <div className="font-semibold mb-3 text-primary-700 flex items-center gap-2 text-lg"><FaGlobe className="text-primary-600" />International Media Summary</div>
            <div className="mb-3 text-gray-700 text-base flex-1">{data.international_summary || summary.comparison?.international_media || "Not covered"}</div>
            {matchesSection("International Matches", data.international_matches || summary.international_matches || [])}
          </div>
        </div>
        {/* Score and Extras */}
        <div className="flex flex-col md:flex-row md:items-center gap-10 mb-14 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-8 flex-1 flex flex-col items-center min-h-[120px]">
            <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2 text-lg"><FaCheckCircle className="text-green-500" />Score</div>
            <div className="text-3xl font-mono text-primary-700">{typeof data.score === "number" ? data.score.toFixed(3) : "-"}</div>
          </div>
          {/* Add more metadata or extras here if needed */}
        </div>
        {/* Related Articles Carousel */}
        {data.summary && data.summary.category && (
          <div className="card mb-14 animate-fadein bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 text-primary-700"><FaArrowRight className="text-primary-600" />Related Articles</h2>
            <div className="flex overflow-x-auto gap-6 pb-2">
              {(data.relatedArticles || []).length === 0 ? (
                <div className="text-gray-500">No related articles found.</div>
              ) : (
                (data.relatedArticles || []).map((art: any) => (
                  <a key={art.id} href={`/news/${art.id}`} className="min-w-[260px] max-w-xs bg-gray-50 rounded shadow p-5 hover:bg-primary-50 transition flex flex-col gap-2">
                    <div className="font-bold text-primary-700 truncate text-lg">{art.title}</div>
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
          <div className="card mb-14 animate-fadein bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 text-primary-700"><FaRegNewspaper className="text-primary-600" />Sentiment Breakdown</h2>
            <div className="flex justify-center">
              <div style={{ width: 340, height: 340 }}>
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
            </div>
          </div>
        )}
        {/* More from this Source */}
        {data.source && (
          <div className="card mb-14 animate-fadein bg-white rounded-2xl shadow p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-5 flex items-center gap-2 text-primary-700"><FaNewspaper className="text-primary-600" />More from {data.source}</h2>
            <div className="flex flex-wrap gap-6">
              {(data.moreFromSource || []).length === 0 ? (
                <div className="text-gray-500">No more articles from this source.</div>
              ) : (
                (data.moreFromSource || []).map((art: any) => (
                  <a key={art.id} href={`/news/${art.id}`} className="w-72 bg-gray-50 rounded shadow p-5 hover:bg-primary-50 transition flex flex-col gap-2">
                    <div className="font-bold text-primary-700 truncate text-lg">{art.title}</div>
                    <div className="text-xs text-gray-500">{art.publishedDate ? format(new Date(art.publishedDate), "MMM d, yyyy") : "-"}</div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}
        <style jsx global>{`
          .animate-fadein { animation: fadein 0.7s; }
          @keyframes fadein { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        `}</style>
      </div>
    </div>
  );
} 