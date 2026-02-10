"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchReports, fetchAnalyticsSummary } from "@/lib/api";
import AudioUpload from "@/components/AudioUpload";
import type { Report, AnalyticsSummary } from "@/lib/api";

export default function Home() {
  const [reports, setReports] = useState<Report[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsData, summaryData] = await Promise.all([
          fetchReports(),
          fetchAnalyticsSummary(),
        ]);
        setReports(reportsData);
        setSummary(summaryData);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAudioAnalyzed = async (report: Report) => {
    setIsAnalyzing(false);
    try {
      const [reportsData, summaryData] = await Promise.all([
        fetchReports(),
        fetchAnalyticsSummary(),
      ]);
      setReports(reportsData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to refresh:", err);
    }
  };

  const totalViolations = summary?.total_violations ?? 0;
  const complianceRate = summary
    ? Math.round(summary.avg_compliance_score)
    : 0;
  const avgRiskScore = summary ? Math.round(100 - summary.avg_risk_score) : 0;
  const riskLabel =
    avgRiskScore <= 35 ? "Low risk" : avgRiskScore <= 65 ? "Medium risk" : "High risk";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">Upload and analyze financial call recordings</p>
        </div>

        {/* Upload Area */}
        <div className="mb-8 bg-gray-900 rounded-xl border border-gray-800 p-8">
          <AudioUpload onAnalyzed={handleAudioAnalyzed} />
          {isAnalyzing && (
            <p className="mt-4 text-center text-emerald-400 text-sm">Analyzing your call...</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="TOTAL REPORTS"
            value={reports.length.toString()}
            subtitle={reports.length > 0 ? `${reports.length} analyzed` : "No reports yet"}
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="VIOLATIONS FOUND"
            value={totalViolations.toString()}
            subtitle="Across all reports"
            icon={
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            }
          />
          <StatCard
            label="COMPLIANCE RATE"
            value={`${complianceRate}%`}
            subtitle={reports.length > 0 ? "Average score" : "No data yet"}
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="AVG. RISK SCORE"
            value={`${avgRiskScore}%`}
            subtitle={riskLabel}
            icon={
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>

        {/* Recent Reports */}
        {!loading && reports.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Reports</h2>
              <Link href="/reports" className="text-emerald-400 hover:text-emerald-300 text-sm">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {reports.slice(0, 4).map((report, idx) => {
                const riskScore = report.risk_score || 0;
                const level = report.risk_level || (riskScore >= 65 ? "high" : riskScore >= 35 ? "medium" : "low");
                const filename = report.filename || "Unknown Call";
                const timestamp = report.timestamp || new Date().toISOString();
                const reportId = report.id || `report-${idx}`;
                const violationsCount = report.violations?.length || 0;
                const compScore = Math.max(0, 100 - riskScore);

                const badgeColor =
                  level === "high"
                    ? "bg-rose-500/20 text-rose-400"
                    : level === "medium"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400";

                const date = new Date(timestamp);
                const dateStr = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                // Generate a descriptive title from the filename
                const title = formatCallTitle(filename);

                return (
                  <Link key={reportId} href={`/reports/${reportId}`}>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-600 transition-colors cursor-pointer h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
                          {level.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-100 text-sm mb-1 truncate">{title}</h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {dateStr} &nbsp;⏱ {timeStr}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-800">
                        <span className="text-xs text-gray-400">
                          {violationsCount} violation{violationsCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs font-medium text-gray-300">
                          Risk: {riskScore}%
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && (
          <div className="text-center py-12 bg-gray-900 rounded-xl border border-gray-800">
            <p className="text-gray-500">No reports yet. Upload an audio file above to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

function formatCallTitle(filename: string): string {
  // Strip timestamps and extensions for a cleaner display
  let name = filename
    .replace(/^\d{8}_\d{6}_/, "")
    .replace(/\.\w+$/, "")
    .replace(/_/g, " ");

  // If it's still just a number/hash, make a generic title
  if (/^\d+(\.\d+)?$/.test(name)) {
    return `Call Recording — ${name.slice(0, 8)}...`;
  }

  return name || "Call Recording";
}
