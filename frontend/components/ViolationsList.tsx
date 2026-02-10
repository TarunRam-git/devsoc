"use client";

import type { ViolationDetail } from "@/lib/api";

interface ViolationsListProps {
    violations: ViolationDetail[] | string[];
}

export default function ViolationsList({ violations }: ViolationsListProps) {
    if (!violations || violations.length === 0) {
        return (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-gray-400 text-sm">No violations detected</p>
            </div>
        );
    }

    // Normalize violations to objects
    const normalizedViolations: ViolationDetail[] = violations.map((v) => {
        if (typeof v === "string") {
            return {
                type: "Policy Violation",
                severity: "high" as const,
                description: v,
            };
        }
        return v;
    });

    const severityColors: Record<string, string> = {
        high: "border-l-4 border-rose-500 bg-rose-500/5",
        medium: "border-l-4 border-amber-500 bg-amber-500/5",
        low: "border-l-4 border-blue-500 bg-blue-500/5",
    };

    const severityBadge: Record<string, string> = {
        high: "bg-rose-500/20 text-rose-400",
        medium: "bg-amber-500/20 text-amber-400",
        low: "bg-blue-500/20 text-blue-400",
    };

    return (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-base font-semibold text-gray-100">
                    Violations ({normalizedViolations.length})
                </h3>
            </div>
            <div className="divide-y divide-gray-800/50 max-h-[500px] overflow-y-auto">
                {normalizedViolations.map((violation, idx) => (
                    <div
                        key={idx}
                        className={`p-4 ${severityColors[violation.severity] || severityColors.medium}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-100 text-sm">{violation.type}</h4>
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge[violation.severity]}`}
                            >
                                {violation.severity.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{violation.description}</p>
                        {violation.quote && (
                            <div className="mt-2 p-2.5 bg-gray-800/50 rounded-lg border-l-2 border-gray-600">
                                <p className="text-xs text-gray-400 italic leading-relaxed">
                                    &ldquo;{violation.quote}&rdquo;
                                </p>
                            </div>
                        )}
                        {violation.action_required && violation.action_required !== violation.description && (
                            <p className="text-xs text-amber-400/80 mt-2">
                                ⚡ {violation.action_required}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
