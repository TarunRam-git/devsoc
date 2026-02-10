"use client";

import { Report } from "@/lib/api";
import Link from "next/link";

interface ReportCardProps {
    report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
    const riskScore = report.risk_score || 0;
    const level = report.risk_level || (riskScore >= 65 ? "high" : riskScore >= 35 ? "medium" : "low");
    const reportId = report.id || "unknown";
    const violationsCount = report.violations?.length || 0;
    const compScore = Math.max(0, 100 - riskScore);

    const badgeColor =
        level === "high"
            ? "bg-rose-500/20 text-rose-400"
            : level === "medium"
            ? "bg-amber-500/20 text-amber-400"
            : "bg-emerald-500/20 text-emerald-400";

    const date = new Date(report.timestamp || new Date().toISOString());
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
    const title = formatCallTitle(report.filename || "Unknown Call");

    return (
        <Link href={`/reports/${reportId}`}>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-600 transition-colors cursor-pointer h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
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
}

function formatCallTitle(filename: string): string {
    let name = filename
        .replace(/^\d{8}_\d{6}_/, "")
        .replace(/\.\w+$/, "")
        .replace(/_/g, " ");

    if (/^\d+(\.\d+)?$/.test(name)) {
        return `Call Recording — ${name.slice(0, 8)}...`;
    }

    return name || "Call Recording";
}
