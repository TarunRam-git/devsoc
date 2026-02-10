"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchReport, fetchCallerHistory } from "@/lib/api";
import StressChart from "@/components/StressChart";
import TranscriptViewer from "@/components/TranscriptViewer";
import ViolationsList from "@/components/ViolationsList";
import ObligationsList from "@/components/ObligationsList";
import type { Report } from "@/lib/api";

function formatCallTitle(filename: string): string {
    return filename
        .replace(/^\d{8}_\d{6}_/, "")
        .replace(/\.[^.]+$/, "")
        .replace(/[_-]/g, " ");
}

export default function ReportDetailPage() {
    const params = useParams();
    const reportId = params.id as string;

    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCallerHistory, setShowCallerHistory] = useState(false);
    const [callerHistory, setCallerHistory] = useState<Report[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const loadReport = async () => {
            try {
                const data = await fetchReport(reportId);
                if (!data) throw new Error("Report not found");
                setReport(data);
            } catch (err) {
                setError("Failed to load report");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadReport();
    }, [reportId]);

    const handleShowCallerHistory = async () => {
        if (!report) return;
        setShowCallerHistory(true);
        setLoadingHistory(true);
        try {
            const callerId = report.id || "unknown";
            const history = await fetchCallerHistory(callerId);
            setCallerHistory(history);
        } catch (err) {
            console.error("Failed to fetch caller history:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const riskBadge = (level?: string) => {
        const l = (level || "low").toLowerCase();
        if (l === "high") return "bg-rose-500/20 text-rose-400 border border-rose-500/30";
        if (l === "medium") return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400 animate-pulse">Loading report...</p>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="bg-red-900/20 border border-red-700 rounded-xl p-6">
                        <p className="text-red-200">{error || "Report not found"}</p>
                    </div>
                    <Link href="/reports" className="mt-4 inline-block text-emerald-400 hover:text-emerald-300 text-sm">
                        ← Back to Reports
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <Link href="/reports" className="text-emerald-400 hover:text-emerald-300 text-sm mb-4 inline-block">
                    ← Back to Reports
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold mb-1">{formatCallTitle(report.filename || "Unknown Call")}</h1>
                        <p className="text-gray-400 text-sm">
                            {new Date(report.timestamp || new Date().toISOString()).toLocaleDateString("en-US", {
                                month: "long", day: "numeric", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${riskBadge(report.risk_level)}`}>
                            {(report.risk_level || "low").toUpperCase()} RISK
                        </span>
                        <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 border border-gray-700">
                            Risk: {report.risk_score || 0}%
                        </span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                        <p className="text-xs font-medium text-gray-500 tracking-wider">VIOLATIONS</p>
                        <p className="text-2xl font-bold mt-1 text-rose-400">{report.violations?.length || 0}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                        <p className="text-xs font-medium text-gray-500 tracking-wider">OBLIGATIONS</p>
                        <p className="text-2xl font-bold mt-1 text-amber-400">{report.obligations?.length || 0}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                        <p className="text-xs font-medium text-gray-500 tracking-wider">AGENT SEGMENTS</p>
                        <p className="text-2xl font-bold mt-1">{report.agent_segments?.length || 0}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                        <p className="text-xs font-medium text-gray-500 tracking-wider">CUSTOMER SEGMENTS</p>
                        <p className="text-2xl font-bold mt-1">{report.customer_segments?.length || 0}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button
                        onClick={handleShowCallerHistory}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-sm"
                    >
                        📞 Caller History
                    </button>
                </div>

                {/* Caller History */}
                {showCallerHistory && (
                    <div className="mb-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Caller History</h3>
                            <button onClick={() => setShowCallerHistory(false)} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
                        </div>
                        {loadingHistory && <p className="text-gray-400 text-sm animate-pulse">Loading...</p>}
                        {!loadingHistory && callerHistory.length === 0 && <p className="text-gray-500 text-sm">No previous calls found</p>}
                        {!loadingHistory && callerHistory.length > 0 && (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {callerHistory.map((call, idx) => (
                                    <Link key={call.id || `call-${idx}`} href={`/reports/${call.id || '#'}`}
                                        className="block p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-colors text-sm">
                                        <p className="font-medium">{formatCallTitle(call.filename || "Unknown Call")}</p>
                                        <p className="text-gray-400 text-xs mt-1">{new Date(call.timestamp || new Date().toISOString()).toLocaleDateString()}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-6">
                    {report.stress_timeline && report.stress_timeline.length > 0 && (
                        <section><StressChart data={report.stress_timeline} /></section>
                    )}

                    <section>
                        <TranscriptViewer
                            agentSegments={report.agent_segments}
                            customerSegments={report.customer_segments}
                            prohibitedPhrases={report.violations}
                            obligations={report.obligations}
                        />
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <section><ViolationsList violations={report.violations || []} /></section>
                        <section><ObligationsList obligations={report.obligations || []} /></section>
                    </div>
                </div>
            </div>
        </div>
    );
}
