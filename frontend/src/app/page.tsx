"use client"

import { useState, useEffect } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement
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

  // Fetch dashboard data
  const fetchDashboard = async (range = dateRange) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (range.start) params.start = range.start;
      if (range.end) params.end = range.end;
      const response = await axios.get("/api/dashboard", { params });
      setData(response.data);
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
    let sorted = [...data.latestIndianNews];
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
  const langChartData = {
    labels: langLabels,
    datasets: [
      {
        label: "Language Distribution",
        data: langValues,
        backgroundColor: [
          "#0ea5e9",
          "#f59e42",
          "#22c55e",
          "#f43f5e",
          "#a78bfa",
          "#fbbf24",
        ],
      },
    ],
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

  // Responsive grid classes
  const gridClass = "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8";

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
        <h2 className="text-2xl font-bold mb-4">Latest Indian News Monitoring</h2>
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
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No news articles found for the selected range.
                  </td>
                </tr>
              ) : (
                paginatedNews().map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.date ? format(new Date(item.date), "MMM d, yyyy") : "-"}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={item.headline}>
                      <a href={item.detailsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">
                        {item.headline.length > 60 ? item.headline.slice(0, 60) + "..." : item.headline}
                      </a>
                    </td>
                    <td className="py-3 px-4">{item.source}</td>
                    <td className="py-3 px-4">{item.category || "-"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${item.sentiment === "Positive" ? "bg-green-100 text-green-700" : item.sentiment === "Negative" ? "bg-red-100 text-red-700" : item.sentiment === "Cautious" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                        {item.sentiment}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a href={item.detailsUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">View</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-end items-center gap-2 mt-2">
          <button
            className="px-3 py-1 rounded border bg-white hover:bg-gray-100"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span>Page {page}</span>
          <button
            className="px-3 py-1 rounded border bg-white hover:bg-gray-100"
            onClick={() => setPage((p) => (paginatedNews().length < PAGE_SIZE ? p : p + 1))}
            disabled={paginatedNews().length < PAGE_SIZE}
          >
            Next
          </button>
        </div>
      </div>

      {/* Timeline of Key Events */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Timeline of Key Events</h2>
        {data.timelineEvents.length === 0 ? (
          <div className="text-gray-500 py-4">No events found for the selected range.</div>
        ) : (
          <ul className="space-y-2">
            {data.timelineEvents.map((event: any, idx: number) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-gray-500 text-sm w-32">{event.date ? format(new Date(event.date), "MMM d, yyyy") : "-"}</span>
                <span className="font-medium">{event.event}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Language Press Comparison */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Language Press Comparison</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2">
            <Pie data={langChartData} options={{ plugins: { legend: { position: "bottom" }, tooltip: { enabled: true } } }} />
          </div>
          <div className="w-full md:w-1/2">
            <Bar data={langChartData} options={{ plugins: { legend: { display: false }, tooltip: { enabled: true } } }} />
          </div>
        </div>
      </div>

      {/* Fact-Checking: Cross-Media Comparison */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Fact-Checking: Cross-Media Comparison</h2>
        {data.factChecking.bangladeshiAgreement === 0 && data.factChecking.internationalAgreement === 0 ? (
          <div className="text-gray-500 py-4">No fact-checking data available.</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2">
              <div className="mb-2 font-semibold">Bangladeshi Sources</div>
              <div>Agreement: {data.factChecking.bangladeshiAgreement}</div>
              <div>Verification Status: {data.factChecking.verificationStatus}</div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="mb-2 font-semibold">International Sources</div>
              <div>Agreement: {data.factChecking.internationalAgreement}</div>
              <div>Verification Status: {data.factChecking.verificationStatus}</div>
            </div>
          </div>
        )}
      </div>

      {/* Key Sources Used, Tone/Sentiment Analysis, Implications & Analysis */}
      <div className={gridClass}>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Key Sources Used</h2>
          {data.keySources.length === 0 ? (
            <div className="text-gray-500 py-4">No sources found.</div>
          ) : (
            <ul className="list-disc pl-5">
              {data.keySources.map((src: string, idx: number) => (
                <li key={idx}>{src}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Tone/Sentiment Analysis</h2>
          {sentimentLabels.length === 0 ? (
            <div className="text-gray-500 py-4">No sentiment data available.</div>
          ) : (
            <Pie data={sentimentChartData} options={{ plugins: { legend: { position: "bottom" }, tooltip: { enabled: true } } }} />
          )}
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Implications & Analysis</h2>
          {data.implications.length === 0 ? (
            <div className="text-gray-500 py-4">No implications found.</div>
          ) : (
            <ul className="space-y-2">
              {data.implications.map((imp: any, idx: number) => (
                <li key={idx}>
                  <span className={`font-semibold px-2 py-1 rounded ${imp.impact === "High" ? "bg-red-100 text-red-700" : imp.impact === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{imp.type}</span>
                  <span className="ml-2 text-sm">{imp.impact} Impact</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Prediction (Outlook) */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">Prediction (Outlook)</h2>
        {data.predictions.length === 0 ? (
          <div className="text-gray-500 py-4">No predictions found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.predictions.map((pred: any, idx: number) => (
              <div key={idx} className="border rounded p-4 bg-gray-50">
                <div className="font-semibold mb-2">{pred.category}</div>
                <div className="mb-1">Likelihood: <span className="font-bold text-primary-600">{pred.likelihood}%</span></div>
                <div className="mb-1">Time Frame: {pred.timeFrame}</div>
                <div className="text-gray-700 text-sm">{pred.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 