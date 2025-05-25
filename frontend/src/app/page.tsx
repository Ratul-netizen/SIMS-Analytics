"use client"

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Line, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js";
import { FaCheckCircle, FaExclamationCircle, FaRegNewspaper, FaChartLine, FaCloud, FaNewspaper, FaGlobe } from "react-icons/fa";
import ChartDataLabels from "chartjs-plugin-datalabels";
import ReactWordcloud from 'react-wordcloud';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
  ChartDataLabels
);

const PAGE_SIZE = 10;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [tableLoading, setTableLoading] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [sentimentFilter, setSentimentFilter] = useState<string>("");
  const [keywordFilter, setKeywordFilter] = useState<string>("");
  const [factCheckTooltip, setFactCheckTooltip] = useState<{ show: boolean, text: string, x: number, y: number }>({ show: false, text: '', x: 0, y: 0 });

  // Fetch dashboard data
  const fetchDashboard = async (range = dateRange, cat = category) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (range.start) params.start = range.start;
      if (range.end) params.end = range.end;
      if (cat) params.category = cat;
      const response = await axios.get("/api/dashboard", { params });
      setData(response.data);
      // Extract unique categories from the latest news for the dropdown
      const allCats = (response.data.latestIndianNews || []).map((item: any) => item.category).filter(Boolean);
      setCategories(Array.from(new Set(["", ...allCats])));
    } catch (err) {
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line
  }, []);

  // Table sorting
  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  // Table pagination
  const paginatedNews = () => {
    if (!data?.latestIndianNews) return [];
    let filtered = [...data.latestIndianNews];
    if (sentimentFilter) filtered = filtered.filter(item => item.sentiment === sentimentFilter);
    if (keywordFilter) filtered = filtered.filter(item => (item.headline || '').toLowerCase().includes(keywordFilter.toLowerCase()));
    let sorted = [...filtered];
    sorted.sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";
      if (sortBy === "date") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    const startIdx = (page - 1) * PAGE_SIZE;
    return sorted.slice(startIdx, startIdx + PAGE_SIZE);
  };

  // Date range filter
  const handleDateChange = (e: any) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };
  const handleDateFilter = async () => {
    setTableLoading(true);
    await fetchDashboard(dateRange);
    setTableLoading(false);
    setPage(1);
  };

  // Pie/Bar data for language distribution
  const langLabels = Object.keys(data?.languageDistribution || {});
  const langValues = Object.values(data?.languageDistribution || {});
  const langColors = ["#0ea5e9", "#f59e42", "#22c55e", "#f43f5e", "#a78bfa", "#fbbf24"];
  const langChartData = {
    labels: langLabels,
    datasets: [
      {
        label: "Language Distribution",
        data: langValues,
        backgroundColor: langColors.slice(0, langLabels.length),
      },
    ],
  };
  const langPieOptions = {
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percent}%)`;
          },
        },
      },
    },
    datalabels: {
      display: true,
      color: "#222",
      font: { weight: "bold" as const },
      formatter: (value: number, ctx: any) => {
        const total = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
        return total ? `${((value / total) * 100).toFixed(1)}%` : '';
      },
    },
    maintainAspectRatio: false,
    responsive: true
  };
  const langBarOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed.y;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percent}%)`;
          },
        },
      },
      datalabels: {
        display: true,
        color: "#222",
        font: { weight: "bold" as const },
        anchor: "end" as const,
        align: "top" as const,
        formatter: (value: number, ctx: any) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          return total ? `${((value / total) * 100).toFixed(1)}%` : '';
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 10 } },
    },
  };

  // Pie/Bar data for sentiment
  const sentimentColorMap: Record<string, string> = {
    Negative: "#ef4444", // red-500
    Neutral: "#3b82f6",  // blue-500
    Positive: "#22c55e", // green-500
    Cautious: "#fbbf24", // yellow-400
  };
  const sentimentLabels = Object.keys(data?.toneSentiment || {});
  const sentimentValues = Object.values(data?.toneSentiment || {});
  const sentimentChartData = {
    labels: sentimentLabels,
    datasets: [
      {
        label: "Sentiment",
        data: sentimentValues,
        backgroundColor: sentimentLabels.map(
          (label) => sentimentColorMap[label] || "#a78bfa" // fallback color
        ),
      },
    ],
  };

  // Category color map
  const categoryColorMap: Record<string, string> = {
    Health: "bg-green-100 text-green-700",
    Politics: "bg-blue-100 text-blue-700",
    Economy: "bg-yellow-100 text-yellow-700",
    Education: "bg-purple-100 text-purple-700",
    Security: "bg-red-100 text-red-700",
    Sports: "bg-indigo-100 text-indigo-700",
    Technology: "bg-pink-100 text-pink-700",
    Environment: "bg-emerald-100 text-emerald-700",
    International: "bg-cyan-100 text-cyan-700",
    Culture: "bg-orange-100 text-orange-700",
    Science: "bg-lime-100 text-lime-700",
    Business: "bg-teal-100 text-teal-700",
    Crime: "bg-gray-200 text-gray-700",
    General: "bg-gray-100 text-gray-700",
  };

  const factCheckColor: Record<string, string> = {
    True: "bg-green-100 text-green-700",
    False: "bg-red-100 text-red-700",
    Mixed: "bg-yellow-100 text-yellow-700",
    Unverified: "bg-gray-100 text-gray-700",
  };

  // Responsive grid classes
  const gridClass = "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8";

  // --- New: Stats and Word Cloud helpers ---
  const getSentimentStats = (toneSentiment: any) => {
    return [
      { label: "Positive", value: toneSentiment.Positive || 0, color: "bg-green-100 text-green-700", icon: <FaCheckCircle className="text-green-500" /> },
      { label: "Negative", value: toneSentiment.Negative || 0, color: "bg-red-100 text-red-700", icon: <FaExclamationCircle className="text-red-500" /> },
      { label: "Neutral", value: toneSentiment.Neutral || 0, color: "bg-gray-100 text-gray-700", icon: <FaRegNewspaper className="text-gray-500" /> },
      { label: "Cautious", value: toneSentiment.Cautious || 0, color: "bg-yellow-100 text-yellow-700", icon: <FaRegNewspaper className="text-yellow-500" /> },
    ];
  };
  const getVerificationStats = (factChecking: any) => {
    return [
      { label: "Verified", value: factChecking.verificationStatus === "Verified" ? factChecking.bangladeshiAgreement : 0, color: "bg-green-100 text-green-700" },
      { label: "Unverified", value: factChecking.verificationStatus === "Unverified" ? factChecking.bangladeshiAgreement : 0, color: "bg-gray-100 text-gray-700" },
    ];
  };
  const getTopKeywords = (news: any[]) => {
    const stopwords = ["the", "of", "in", "and", "to", "a", "on", "for", "as", "is", "at", "by", "an", "with", "from", "be", "it", "that", "this", "will", "are", "has", "after", "was", "not", "but", "or", "its", "his", "her", "their", "he", "she", "they", "we", "you", "i", "have", "had", "were", "which", "who", "what", "when", "where", "how", "why", "all", "more", "new", "about", "into", "out", "up", "over", "than", "so", "if", "no", "do", "does", "did", "can", "just", "now", "may", "also", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
    const freq: Record<string, number> = {};
    news.forEach(item => {
      (item.headline || "").split(/\W+/).forEach((word: string) => {
        const w = word.toLowerCase();
        if (w.length > 2 && !stopwords.includes(w)) freq[w] = (freq[w] || 0) + 1;
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl">{error || "No data available."}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 md:px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold">SIMS Analytics Dashboard</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="border rounded px-2 py-1" />
          <span>-</span>
          <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="border rounded px-2 py-1" />
          <button className="btn-primary ml-2" onClick={handleDateFilter} disabled={tableLoading}>
            {tableLoading ? "Loading..." : "Update Now"}
          </button>
        </div>
      </div>

      {/* Latest Indian News Monitoring */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <h2 className="text-2xl font-bold">Latest Indian News</h2>
          <div className="flex gap-2 items-center">
            <label htmlFor="category" className="font-medium">Category:</label>
            <select
              id="category"
              className="border rounded px-2 py-1"
              value={category}
              onChange={async (e) => {
                setCategory(e.target.value);
                setPage(1);
                await fetchDashboard(dateRange, e.target.value);
              }}
            >
              <option value="">All</option>
              {categories.filter((cat) => cat && cat !== "").map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                {[
                  { label: "Date", key: "date" },
                  { label: "Headline", key: "headline" },
                  { label: "Source", key: "source" },
                  { label: "Category", key: "category" },
                  { label: "Sentiment", key: "sentiment" },
                  { label: "Fact Checked", key: "fact_check" },
                  { label: "Details", key: "detailsUrl" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="text-left py-3 px-4 cursor-pointer select-none"
                    onClick={() => col.key !== "detailsUrl" && handleSort(col.key)}
                  >
                    {col.label}
                    {sortBy === col.key && (
                      <span className="ml-1">{sortDir === "asc" ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedNews().length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No news articles found for the selected range.
                  </td>
                </tr>
              ) : (
                paginatedNews().map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.date ? format(new Date(item.date), "MMM d, yyyy") : "-"}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={item.headline}>
                      <a href={`/news/${item.id}`} className="text-primary-600 underline">
                        {item.headline.length > 60 ? item.headline.slice(0, 60) + "..." : item.headline}
                      </a>
                    </td>
                    <td className="py-3 px-4">{item.source}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${categoryColorMap[(item.category && typeof item.category === 'string' ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'General')] || categoryColorMap['General']}`}>{item.category ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) : 'General'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm
                        ${item.sentiment === 'Positive' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
                        ${item.sentiment === 'Negative' ? 'bg-red-100 text-red-700 border border-red-300' : ''}
                        ${item.sentiment === 'Neutral' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                        ${item.sentiment === 'Cautious' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : ''}
                        ${!item.sentiment ? 'bg-gray-100 text-gray-700 border border-gray-300' : ''}
                      `}>
                        {item.sentiment || 'Neutral'}
                      </span>
                    </td>
                    <td className="py-3 px-4 relative">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${item.fact_check ? factCheckColor[item.fact_check] || 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'}`}
                        onMouseEnter={e => setFactCheckTooltip({ show: true, text: `Fact-check status: ${item.fact_check || 'Unverified'}`, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setFactCheckTooltip({ ...factCheckTooltip, show: false })}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.fact_check || 'Unverified'}
                      </span>
                      {factCheckTooltip.show && (
                        <div style={{ position: 'fixed', left: factCheckTooltip.x + 10, top: factCheckTooltip.y + 10, zIndex: 1000 }} className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg">
                          {factCheckTooltip.text}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <a href={`/news/${item.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400" title="View details">
                        <FaRegNewspaper className="text-base" /> View
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Bar */}
        {data.latestIndianNews && data.latestIndianNews.length > 0 && (
          <div className="flex justify-end items-center mt-4">
            <button
              className="px-4 py-2 rounded-l bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white border-t border-b text-gray-700 font-medium">
              Page {page} of {Math.ceil(data.latestIndianNews.length / PAGE_SIZE)}
            </span>
            <button
              className="px-4 py-2 rounded-r bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.latestIndianNews.length / PAGE_SIZE)}
            >
              Next
            </button>
          </div>
        )}
      </div>
      {/* Show alert for negative sentiment spike immediately after news box */}
      {(() => {
        if (!data.latestIndianNews) return null;
        const sentiments = data.latestIndianNews.map((item: any) => item.sentiment);
        const negativeSpike = sentiments.filter((s: string) => s === 'Negative').length > data.latestIndianNews.length * 0.5;
        if (negativeSpike) {
          return (
            <div className="bg-red-100 text-red-700 rounded-lg shadow p-4 mb-8 font-semibold">
              Alert: Negative sentiment spike detected in recent news!
            </div>
          );
        }
        return null;
      })()}
      {/* Dashboard Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Language Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaGlobe /> Language Distribution</h3>
          <div className="w-full h-64">
            <Pie data={langChartData} options={langPieOptions} />
          </div>
        </div>
        {/* Sentiment Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaChartLine /> Sentiment Analysis</h3>
          <div className="w-full h-64">
            <Bar
              data={sentimentChartData}
              options={{
                ...langBarOptions,
                plugins: {
                  ...langBarOptions.plugins,
                  legend: { display: true, position: 'bottom' },
                  tooltip: {
                    ...langBarOptions.plugins.tooltip,
                    callbacks: {
                      ...langBarOptions.plugins.tooltip.callbacks,
                      afterLabel: function(context: any) {
                        return 'Click to filter by sentiment';
                      }
                    }
                  },
                },
                onClick: (evt: any, elements: any[]) => {
                  if (elements && elements.length > 0) {
                    const idx = elements[0].index;
                    const label = sentimentLabels[idx];
                    setSentimentFilter(label === sentimentFilter ? '' : label);
                    setPage(1);
                  }
                },
                scales: {
                  ...langBarOptions.scales,
                  x: {
                    title: { display: true, text: 'Sentiment' },
                  },
                  y: {
                    ...langBarOptions.scales.y,
                    title: { display: true, text: 'Count' },
                  },
                },
              }}
            />
            {sentimentFilter && (
              <div className="mt-2 text-sm text-primary-600">Filtered by sentiment: <b>{sentimentFilter}</b> <button className="ml-2 underline" onClick={() => setSentimentFilter("")}>Clear</button></div>
            )}
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {getSentimentStats(data.toneSentiment).map(stat => (
          <div key={stat.label} className={`flex flex-col items-center bg-white rounded-lg shadow p-4 ${stat.color}`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>
      {/* Word Cloud */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><FaCloud className="text-primary-500" /> Top Keywords</h3>
        <div className="w-full h-96">
          <ReactWordcloud
            words={getTopKeywords(data.latestIndianNews).map(([word, count]) => ({ text: word, value: count }))}
            options={{
              rotations: 1,
              rotationAngles: [0, 0],
              fontSizes: [16, 40] as any,
              fontFamily: 'inherit',
              colors: [
                '#0ea5e9', '#22c55e', '#fbbf24', '#f43f5e', '#a78bfa', '#f59e42', '#fbbf24', '#a3e635', '#f472b6', '#818cf8'
              ],
              enableTooltip: true,
              deterministic: false,
              scale: 'sqrt',
              spiral: 'archimedean',
            }}
            callbacks={{
              onWordClick: (word: any) => {
                setKeywordFilter(word.text === keywordFilter ? '' : word.text);
                setPage(1);
              },
              getWordTooltip: (word: any) => `${word.text}: ${word.value} (Click to filter)`
            }}
          />
          {keywordFilter && (
            <div className="mt-2 text-sm text-primary-600">Filtered by keyword: <b>{keywordFilter}</b> <button className="ml-2 underline" onClick={() => setKeywordFilter("")}>Clear</button></div>
          )}
        </div>
      </div>
      {/* --- New: Interactive Timeline of Events --- */}
      {data.latestIndianNews && data.latestIndianNews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaRegNewspaper /> Timeline of Key Events</h3>
          <div className="overflow-x-auto">
            <ul className="timeline timeline-vertical">
              {data.latestIndianNews.slice(0, 10).map((item: any) => (
                <li key={item.id} className="mb-4">
                  <span className="font-bold">{item.date ? format(new Date(item.date), "MMM d, yyyy") : "-"}</span>: 
                  <a href={item.url || `/news/${item.id}`} className="text-primary-600 underline ml-2" target="_blank" rel="noopener noreferrer">
                    {item.headline.length > 80 ? item.headline.slice(0, 80) + "..." : item.headline}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* --- New: Sentiment Over Time Line Chart --- */}
      {data.latestIndianNews && data.latestIndianNews.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaChartLine /> Sentiment Over Time</h3>
          <div className="w-full max-w-4xl h-80 flex items-center justify-center">
            <Line data={{
              labels: data.latestIndianNews.map((item: any) => item.date ? format(new Date(item.date), "MMM d") : "-"),
              datasets: [
                {
                  label: "Sentiment",
                  data: data.latestIndianNews.map((item: any) => item.sentiment === 'Positive' ? 1 : item.sentiment === 'Negative' ? -1 : 0),
                  borderColor: "#3b82f6",
                  backgroundColor: "rgba(59,130,246,0.1)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                },
              ],
            }} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { min: -1, max: 1, ticks: { callback: (v: string | number) => v === 1 ? 'Positive' : v === -1 ? 'Negative' : 'Neutral' } } },
            }} />
          </div>
        </div>
      )}
      {/* --- New: Trending Topics/Entities --- */}
      {data.latestIndianNews && data.latestIndianNews.some((item: any) => item.topics || item.entities) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaCloud /> Trending Topics & Entities</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(data.latestIndianNews.flatMap((item: any) => [...(item.topics || []), ...(item.entities || [])]))).slice(0, 30).map((topic: any) => (
              <span key={topic} className="inline-block bg-emerald-100 text-emerald-700 rounded px-2 py-1 text-xs font-semibold">{topic}</span>
            ))}
          </div>
        </div>
      )}
      {/* --- New: Media Coverage Comparison Over Time --- */}
      {data.latestIndianNews && data.latestIndianNews.some((item: any) => item.source_type) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaChartLine /> Media Coverage Comparison Over Time</h3>
          <div className="w-full h-64">
            <Line data={{
              labels: Array.from(new Set(data.latestIndianNews.map((item: any) => item.date ? format(new Date(item.date), "MMM d") : "-"))),
              datasets: [
                ...['Indian', 'Bangladeshi', 'International'].map((type) => ({
                  label: type,
                  data: Array.from(new Set(data.latestIndianNews.map((item: any) => item.date ? format(new Date(item.date), "MMM d") : "-"))).map(dateLabel =>
                    data.latestIndianNews.filter((item: any) => (item.date ? format(new Date(item.date), "MMM d") : "-") === dateLabel && item.source_type === type).length
                  ),
                  borderColor: type === 'Indian' ? '#0ea5e9' : type === 'Bangladeshi' ? '#22c55e' : '#f59e42',
                  backgroundColor: type === 'Indian' ? 'rgba(14,165,233,0.1)' : type === 'Bangladeshi' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,66,0.1)',
                  fill: false,
                  tension: 0.4,
                }))
              ],
            }} options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
            }} />
          </div>
        </div>
      )}
      {/* --- New: Geographical Heatmap (Placeholder) --- */}
      {data.latestIndianNews && data.latestIndianNews.some((item: any) => item.location) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaGlobe /> Geographical Heatmap</h3>
          <div className="text-gray-500">[Heatmap visualization would go here if location data is available]</div>
        </div>
      )}
      {/* --- New: Source Credibility/Trust Score --- */}
      {data.latestIndianNews && data.latestIndianNews.some((item: any) => item.credibility_score) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaCheckCircle /> Source Credibility Scores</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Source</th>
                <th className="text-left py-2 px-4">Credibility Score</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(data.latestIndianNews.map((item: any) => item.source))).map((source: any) => {
                const score = data.latestIndianNews.find((item: any) => item.source === source)?.credibility_score;
                return score ? (
                  <tr key={source} className="border-b">
                    <td className="py-2 px-4">{source}</td>
                    <td className="py-2 px-4">{score}</td>
                  </tr>
                ) : null;
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* --- New: Article Similarity/Clustering (Placeholder) --- */}
      {data.latestIndianNews && data.latestIndianNews.some((item: any) => item.cluster_id) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaRegNewspaper /> Article Clusters</h3>
          <div className="text-gray-500">[Cluster visualization would go here if cluster_id/topic data is available]</div>
        </div>
      )}
      {/* --- New: Media Bias Analysis (Placeholder) --- */}
      {data.latestIndianNews && data.latestIndianNews.some((item: any) => item.topic) && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaExclamationCircle /> Media Bias Analysis</h3>
          <div className="text-gray-500">[Media bias comparison would go here if topic/source/sentiment data is available]</div>
        </div>
      )}
      {/* --- Implications & Analysis --- */}
      {data.implications && data.implications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Implications & Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.implications.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded border border-gray-200 bg-gray-50">
                <div className="font-bold">{item.type}</div>
                <div>Impact: <span className="font-semibold">{item.impact}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* --- Prediction (Outlook) --- */}
      {data.predictions && data.predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Prediction (Outlook)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.predictions.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded border border-yellow-200 bg-yellow-50">
                <div className="font-bold">{item.category}</div>
                <div>Likelihood: <span className="font-semibold">{item.likelihood}%</span></div>
                <div>Time Frame: {item.timeFrame}</div>
                <div className="mt-2 text-gray-700 text-sm">{item.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* --- Fact-Checking: Cross-Media Comparison --- */}
      {data.factChecking && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Fact-Checking: Cross-Media Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-bold mb-2">Bangladeshi Sources</div>
              <div>Agreement: {data.factChecking.bangladeshiAgreement}</div>
              <div>Verification Status: {data.factChecking.verificationStatus}</div>
            </div>
            <div>
              <div className="font-bold mb-2">International Sources</div>
              <div>Agreement: {data.factChecking.internationalAgreement}</div>
            </div>
          </div>
        </div>
      )}
      {/* --- Key Sources Used --- */}
      {data.keySources && data.keySources.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Key Sources Used</h3>
          <div className="flex flex-wrap gap-2">
            {data.keySources.map((source: string, idx: number) => (
              <span key={idx} className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-1 text-xs font-semibold">{source}</span>
            ))}
          </div>
        </div>
      )}
      {/* --- New: User-Driven Custom Reports --- */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><FaRegNewspaper /> Export Custom Report</h3>
        <button className="btn-primary" onClick={() => {
          const csv = [
            ['Date', 'Headline', 'Source', 'Category', 'Sentiment', 'Fact Checked', 'URL'],
            ...data.latestIndianNews.map((item: any) => [item.date, item.headline, item.source, item.category, item.sentiment, item.fact_check, item.url || ''])
          ].map((row: any[]) => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'custom_report.csv';
          a.click();
          URL.revokeObjectURL(url);
        }}>
          Export as CSV
        </button>
      </div>
    </div>
  );
}