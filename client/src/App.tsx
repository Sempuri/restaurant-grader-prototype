import { useState, useRef } from "react";

type SearchResult = {
  place_id: number;
  display_name: string;
  extratags?: {
    website?: string;
  };
};

type Issue = {
  type: "error" | "warning" | "info";
  text: string;
  category: string;
};

type ScoreBreakdown = {
  score: number;
  maxScore: number;
  percentage: number;
};

type AIInsights = {
  summary: string;
  topPriority: string;
  quickWins: string[];
  competitorTip: string;
  estimatedImpact: string;
};

type ReportData = {
  url: string;
  title: string;
  score: number;
  breakdown?: {
    seo: ScoreBreakdown;
    content: ScoreBreakdown;
    usability: ScoreBreakdown;
    technical: ScoreBreakdown;
  };
  issues: Issue[] | string[];
  loadTime?: number;
  aiInsights?: AIInsights;
  error?: string;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [activeTab, setActiveTab] = useState<"issues" | "insights">("issues");
  const debounceRef = useRef<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowManualInput(false);
    setReport(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&extratags=1&limit=5`,
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("OSM Search Error", err);
      }
      setSearchLoading(false);
    }, 300);
  };

  const handleSelect = (place: SearchResult) => {
    setSuggestions([]);
    setQuery(place.display_name.split(",")[0]);
    setSelectedPlaceName(place.display_name);

    const websiteUrl = place.extratags?.website;
    if (websiteUrl) {
      runAudit(websiteUrl);
    } else {
      setShowManualInput(true);
    }
  };

  const runAudit = async (urlToScan: string) => {
    setLoading(true);
    setReport(null);
    setShowManualInput(false);
    setActiveTab("issues");

    const steps = [
      "Fetching website...",
      "Analyzing SEO...",
      "Checking content...",
      "Testing usability...",
      "Running technical checks...",
      "Generating AI insights...",
    ];
    for (const step of steps) {
      setScanStep(step);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      const res = await fetch(`${API_URL}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToScan }),
      });
      const data = await res.json();
      setReport(data);
    } catch {
      setReport({
        url: urlToScan,
        title: "",
        score: 0,
        issues: [],
        error: "Error connecting to backend server",
      });
    }
    setLoading(false);
    setScanStep("");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return {
        bg: "bg-green-500",
        text: "text-green-500",
        light: "bg-green-100",
        stroke: "#22c55e",
      };
    if (score >= 50)
      return {
        bg: "bg-yellow-500",
        text: "text-yellow-500",
        light: "bg-yellow-100",
        stroke: "#eab308",
      };
    return {
      bg: "bg-red-500",
      text: "text-red-500",
      light: "bg-red-100",
      stroke: "#ef4444",
    };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Great";
    if (score >= 50) return "Fair";
    return "Poor";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "error":
        return {
          icon: "!",
          bg: "bg-red-500",
          container: "bg-red-50 border-red-100",
          text: "text-red-800",
        };
      case "warning":
        return {
          icon: "⚠",
          bg: "bg-yellow-500",
          container: "bg-yellow-50 border-yellow-100",
          text: "text-yellow-800",
        };
      default:
        return {
          icon: "i",
          bg: "bg-blue-500",
          container: "bg-blue-50 border-blue-100",
          text: "text-blue-800",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "SEO":
        return "🔍";
      case "Content":
        return "📝";
      case "Usability":
        return "👆";
      case "Technical":
        return "⚙️";
      default:
        return "📋";
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🦁</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">LionLokal Grader</h1>
          <p className="text-gray-400 text-sm mt-1">
            AI-Powered Restaurant Website Audit
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Find a Restaurant
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {searchLoading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              )}
            </span>
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search restaurant name..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Dropdown */}
          {suggestions.length > 0 && (
            <ul className="absolute z-30 w-full bg-white border border-gray-100 shadow-2xl rounded-xl mt-2 max-h-72 overflow-y-auto">
              {suggestions.map((place, index) => {
                const parts = place.display_name
                  .split(",")
                  .map((p) => p.trim());
                const name = parts[0];
                // Address: everything between name and last 2 parts
                const address = parts.slice(1, -2).join(", ");
                // City and Country: last 2 parts
                const cityCountry = parts.slice(-2).join(", ");

                return (
                  <li
                    key={place.place_id}
                    onClick={() => handleSelect(place)}
                    className={`px-4 py-3 cursor-pointer transition-all hover:bg-orange-50 ${index !== suggestions.length - 1 ? "border-b border-gray-100" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-lg">📍</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {name}
                        </p>
                        {address && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {address}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 truncate">
                          {cityCountry}
                        </p>
                        {place.extratags?.website && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Website available
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Manual URL Input */}
        {showManualInput && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>⚠️</span>
              </div>
              <div>
                <p className="text-amber-800 text-sm font-medium">
                  No website found for "{selectedPlaceName.split(",")[0]}"
                </p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Enter the website URL manually
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://restaurant-website.com"
                className="flex-1 p-3 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <button
                onClick={() => runAudit(manualUrl)}
                disabled={!manualUrl}
                className="bg-orange-500 text-white px-5 py-3 rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Scan
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
            </div>
            <p className="text-gray-600 font-medium">{scanStep}</p>
            <p className="text-gray-400 text-xs mt-1">
              This may take a few seconds
            </p>
          </div>
        )}

        {/* Results */}
        {report && !loading && (
          <div className="animate-fadeIn">
            {report.error ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">❌</span>
                </div>
                <p className="text-red-700 font-medium">{report.error}</p>
                <button
                  onClick={() => setReport(null)}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Try again
                </button>
              </div>
            ) : (
              <>
                {/* Score Circle */}
                <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-100">
                  <div className="relative w-32 h-32 mb-3">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke={getScoreColor(report.score).stroke}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(report.score / 100) * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-4xl font-bold ${getScoreColor(report.score).text}`}
                      >
                        {report.score}
                      </span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(report.score).light} ${getScoreColor(report.score).text}`}
                  >
                    {getScoreLabel(report.score)}
                  </span>
                </div>

                {/* Site Info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {report.title || "Restaurant Website"}
                  </h3>
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 text-xs hover:underline truncate block"
                  >
                    {report.url}
                  </a>
                  {report.loadTime && (
                    <p className="text-gray-400 text-xs mt-1">
                      Load time: {(report.loadTime / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>

                {/* Category Breakdown */}
                {report.breakdown && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {Object.entries(report.breakdown).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span>
                            {getCategoryIcon(
                              key.charAt(0).toUpperCase() + key.slice(1),
                            )}
                          </span>
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {key}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${value.percentage >= 70 ? "bg-green-500" : value.percentage >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${value.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {value.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab("issues")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "issues" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    Issues ({report.issues.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("insights")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === "insights" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    ✨ AI Insights
                  </button>
                </div>

                {/* Issues Tab */}
                {activeTab === "issues" && (
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {report.issues.map((issue, i) => {
                      const isLegacy = typeof issue === "string";
                      const issueData = isLegacy
                        ? {
                            type: issue.toLowerCase().includes("good")
                              ? "info"
                              : "error",
                            text: issue,
                            category: "General",
                          }
                        : issue;
                      const style = getIssueIcon(issueData.type);

                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${style.container}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}
                          >
                            <span className="text-white text-xs">
                              {style.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${style.text}`}>
                              {issueData.text}
                            </span>
                            {!isLegacy && (
                              <span className="block text-xs text-gray-400 mt-0.5">
                                {issueData.category}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AI Insights Tab */}
                {activeTab === "insights" && (
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {report.aiInsights ? (
                      <>
                        {/* Summary */}
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🤖</span>
                            <span className="font-semibold text-purple-800 text-sm">
                              AI Summary
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {report.aiInsights.summary}
                          </p>
                        </div>

                        {/* Top Priority */}
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎯</span>
                            <span className="font-semibold text-red-800 text-sm">
                              Top Priority
                            </span>
                          </div>
                          <p className="text-red-700 text-sm">
                            {report.aiInsights.topPriority}
                          </p>
                        </div>

                        {/* Quick Wins */}
                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">⚡</span>
                            <span className="font-semibold text-green-800 text-sm">
                              Quick Wins
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {report.aiInsights.quickWins.map((win, i) => (
                              <li
                                key={i}
                                className="text-green-700 text-sm flex items-start gap-2"
                              >
                                <span className="text-green-500">✓</span>
                                {win}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Competitor Tip */}
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💡</span>
                            <span className="font-semibold text-amber-800 text-sm">
                              Pro Tip
                            </span>
                          </div>
                          <p className="text-amber-700 text-sm">
                            {report.aiInsights.competitorTip}
                          </p>
                        </div>

                        {/* Impact Estimate */}
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                          <p className="text-blue-600 text-xs uppercase tracking-wider mb-1">
                            Estimated Impact
                          </p>
                          <p className="text-2xl font-bold text-blue-700">
                            {report.aiInsights.estimatedImpact}
                          </p>
                          <p className="text-blue-500 text-xs">
                            increase in online visibility
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <span className="text-4xl mb-2 block">🤖</span>
                        <p className="text-sm">AI insights not available</p>
                        <p className="text-xs mt-1">
                          Configure Gemini API key to enable
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Scan Another Button */}
                <button
                  onClick={() => {
                    setReport(null);
                    setQuery("");
                  }}
                  className="w-full mt-6 py-3 border-2 border-orange-200 rounded-xl text-orange-600 font-medium bg-white hover:bg-orange-50 hover:border-orange-500 transition-colors"
                >
                  Scan Another Restaurant
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
