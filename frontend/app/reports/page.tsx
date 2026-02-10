"use client";

import { useEffect, useState } from "react";
import { fetchReports } from "@/lib/api";
import ReportCard from "@/components/ReportCard";
import type { Report } from "@/lib/api";

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const data = await fetchReports();
                setReports(data);
            } catch (err) {
                setError("Failed to load reports");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, []);

    const sortedReports = [...reports].sort(
        (a, b) =>
            new Date(b.timestamp || new Date().toISOString()).getTime() -
            new Date(a.timestamp || new Date().toISOString()).getTime()
    );

    const highRiskCount = reports.filter((r) => r.risk_level === "high").length;
    const mediumRiskCount = reports.filter((r) => r.risk_level === "medium").length;
    const lowRiskCount = reports.filter((r) => r.risk_level === "low").length;

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-1">Call Reports</h1>
                    <p className="text-gray-400 text-sm">
                        Review and analyze financial service call recordings
                    </p>
                </div>

                {/* Stats */}
                {reports.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <p className="text-xs font-medium text-gray-500 tracking-wider">TOTAL CALLS</p>
                            <p className="text-2xl font-bold mt-1">{reports.length}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <p className="text-xs font-medium text-gray-500 tracking-wider">LOW RISK</p>
                            <p className="text-2xl font-bold mt-1 text-emerald-400">{lowRiskCount}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <p className="text-xs font-medium text-gray-500 tracking-wider">MEDIUM RISK</p>
                            <p className="text-2xl font-bold mt-1 text-amber-400">{mediumRiskCount}</p>
                        </div>
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <p className="text-xs font-medium text-gray-500 tracking-wider">HIGH RISK</p>
                            <p className="text-2xl font-bold mt-1 text-rose-400">{highRiskCount}</p>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="text-center py-12">
                        <p className="text-gray-400 animate-pulse">Loading reports...</p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 mb-6">
                        <p className="text-red-200 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && reports.length === 0 && (
                    <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-500">No reports yet. Upload an audio file to get started.</p>
                    </div>
                )}

                {/* Reports grid */}
                {!loading && reports.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {sortedReports.map((report, idx) => (
                            <ReportCard
                                key={report.id || `report-${idx}`}
                                report={report}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
