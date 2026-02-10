"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer,
    Area, AreaChart
} from "recharts";
import {
    fetchAnalyticsSummary, fetchAnalyticsTrends, exportCSV,
    AnalyticsSummary, AnalyticsTrends
} from "@/lib/api";

const COLORS = {
    compliance: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
    risk: { high: "#f43f5e", medium: "#f59e0b", low: "#10b981", unknown: "#6b7280" },
    intent: ["#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#6366f1"],
};

export default function AnalyticsPage() {
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [exportMsg, setExportMsg] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [summaryData, trendsData] = await Promise.all([
                    fetchAnalyticsSummary(),
                    fetchAnalyticsTrends()
                ]);
                setSummary(summaryData);
                setTrends(trendsData);
            } catch (err) {
                setError("Failed to load analytics data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleExportCSV = async () => {
        setExporting(true);
        setExportMsg(null);
        const result = await exportCSV();
        setExporting(false);
        if (result.success) {
            setExportMsg("CSV downloaded successfully!");
        } else {
            setExportMsg(result.error || "Export failed");
        }
        setTimeout(() => setExportMsg(null), 4000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400 animate-pulse">Loading analytics...</p>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || "No data available"}</p>
                    <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm">← Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const riskData = Object.entries(summary.risk_level_distribution || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS.risk[name as keyof typeof COLORS.risk] || "#6b7280"
    }));

    const intentData = Object.entries(summary.intent_distribution || {}).map(([name, value], i) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS.intent[i % COLORS.intent.length]
    }));

    const complianceData = Object.entries(summary.compliance_distribution || {}).map(([name, value], i) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: COLORS.compliance[i % COLORS.compliance.length]
    }));

    const trendsChartData = (trends?.data_points || []).map((point, i) => ({
        index: i + 1,
        compliance: point.compliance_score,
        risk: point.risk_score,
        violations: point.violation_count,
        label: `Call ${i + 1}`
    }));

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Analytics</h1>
                        <p className="text-gray-400 text-sm">
                            Insights from {summary.report_count} analyzed calls
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/query"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
                        >
                            🤖 Ask AI about data
                        </Link>
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                exporting
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                        >
                            {exporting ? "Exporting..." : "⬇ Download CSV"}
                        </button>
                    </div>
                </div>

                {/* Export message */}
                {exportMsg && (
                    <div className="mb-4 p-3 rounded-xl text-sm bg-gray-900 border border-gray-800 text-gray-300">
                        {exportMsg}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <StatCard label="TOTAL CALLS" value={summary.report_count.toString()} />
                    <StatCard
                        label="AVG COMPLIANCE"
                        value={`${summary.avg_compliance_score}%`}
                        accent={summary.avg_compliance_score >= 70 ? "emerald" : summary.avg_compliance_score >= 50 ? "amber" : "rose"}
                    />
                    <StatCard
                        label="AVG RISK"
                        value={summary.avg_risk_score.toString()}
                        accent={summary.avg_risk_score <= 30 ? "emerald" : summary.avg_risk_score <= 60 ? "amber" : "rose"}
                    />
                    <StatCard label="VIOLATIONS" value={summary.total_violations.toString()} accent="rose" />
                    <StatCard label="PII DETECTED" value={summary.total_pii_detected.toString()} accent="amber" />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Risk Distribution */}
                    <ChartCard title="Risk Level Distribution">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={riskData} cx="50%" cy="50%"
                                    outerRadius={95} innerRadius={50} paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {riskData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px", color: "#e5e7eb" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Intent Distribution */}
                    <ChartCard title="Call Intent Breakdown">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={intentData} cx="50%" cy="50%"
                                    outerRadius={95} innerRadius={50} paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={false}
                                >
                                    {intentData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px", color: "#e5e7eb" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Compliance Status */}
                    <ChartCard title="Compliance Status">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={complianceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                                <YAxis dataKey="name" type="category" stroke="#6b7280" width={100} fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px", color: "#e5e7eb" }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {complianceData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Trends */}
                    <ChartCard title="Compliance & Risk Trends">
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={trendsChartData}>
                                <defs>
                                    <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                                <YAxis stroke="#6b7280" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1f2937", borderRadius: "8px", color: "#e5e7eb" }} />
                                <Legend />
                                <Area type="monotone" dataKey="compliance" stroke="#10b981" fillOpacity={1} fill="url(#colorCompliance)" name="Compliance Score" />
                                <Area type="monotone" dataKey="risk" stroke="#f43f5e" fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* Bottom Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <MiniStat label="Min Compliance" value={`${summary.min_compliance_score}%`} />
                    <MiniStat label="Max Compliance" value={`${summary.max_compliance_score}%`} />
                    <MiniStat label="Obligations" value={summary.total_obligations.toString()} />
                    <MiniStat label="Avg Duration" value={`${Math.round(summary.avg_duration_seconds)}s`} />
                    <MiniStat label="Total Duration" value={`${Math.round(summary.total_duration_seconds / 60)}m`} />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
    const accentColor = accent === "emerald" ? "text-emerald-400"
        : accent === "amber" ? "text-amber-400"
        : accent === "rose" ? "text-rose-400"
        : "text-gray-100";
    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-xs font-medium text-gray-500 tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${accentColor}`}>{value}</p>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
            {children}
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold mt-0.5">{value}</p>
        </div>
    );
}
