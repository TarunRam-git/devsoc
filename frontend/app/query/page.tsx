"use client";

import { useEffect, useRef, useState } from "react";
import {
    sendQuery, fetchQuerySuggestions,
    type QueryResponse, type QuerySuggestion
} from "@/lib/api";
import MarkdownMessage from "@/components/MarkdownMessage";

interface ChatMessage {
    id: string;
    role: "user" | "bot";
    content: string;
    timestamp: Date;
    dataContext?: { total_calls: number; data_source: string };
}

export default function QueryPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
    const [sessionId] = useState(() => `query_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchQuerySuggestions().then(setSuggestions); }, []);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleSend = async (question?: string) => {
        const q = (question || input).trim();
        if (!q || loading) return;

        const userMsg: ChatMessage = {
            id: `user_${Date.now()}`, role: "user", content: q, timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await sendQuery(q, sessionId);
            const botMsg: ChatMessage = {
                id: `bot_${Date.now()}`, role: "bot",
                content: response?.answer || "I wasn't able to process that question. Please try again.",
                timestamp: new Date(), dataContext: response?.data_context,
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            setMessages((prev) => [...prev, {
                id: `err_${Date.now()}`, role: "bot",
                content: "Something went wrong. Please make sure the backend is running and try again.",
                timestamp: new Date(),
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const catColors: Record<string, string> = {
        overview: "border-blue-700 text-blue-300 hover:bg-blue-900/30",
        compliance: "border-emerald-700 text-emerald-300 hover:bg-emerald-900/30",
        risk: "border-rose-700 text-rose-300 hover:bg-rose-900/30",
        sentiment: "border-purple-700 text-purple-300 hover:bg-purple-900/30",
        privacy: "border-amber-700 text-amber-300 hover:bg-amber-900/30",
        intent: "border-cyan-700 text-cyan-300 hover:bg-cyan-900/30",
        emotion: "border-pink-700 text-pink-300 hover:bg-pink-900/30",
        outcome: "border-orange-700 text-orange-300 hover:bg-orange-900/30",
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col" style={{ height: "calc(100vh - 52px)" }}>
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
                    {/* Welcome */}
                    {messages.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto mb-5">
                                🤖
                            </div>
                            <h2 className="text-xl font-bold mb-2">Ask AI about your data</h2>
                            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
                                I can answer questions about your analyzed calls — compliance, risk,
                                sentiments, PII, and more.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => handleSend(s.text)}
                                        className={`px-3 py-2 rounded-lg text-xs border transition cursor-pointer ${catColors[s.category] || "border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                                msg.role === "user"
                                    ? "bg-emerald-600 text-white rounded-br-sm"
                                    : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-sm"
                            }`}>
                                {msg.role === "bot" && (
                                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                        <span className="text-emerald-400">AI Assistant</span>
                                        {msg.dataContext && (
                                            <span className="bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                                                {msg.dataContext.total_calls} calls
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="text-sm leading-relaxed">
                                    {msg.role === "bot" ? (
                                        <MarkdownMessage content={msg.content} />
                                    ) : (
                                        <span className="whitespace-pre-wrap">{msg.content}</span>
                                    )}
                                </div>
                                <div className={`text-xs mt-2 ${msg.role === "user" ? "text-white/50" : "text-gray-600"}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-900 border border-gray-800 rounded-xl rounded-bl-sm px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick suggestions (after first message) */}
            {messages.length > 0 && messages.length < 4 && (
                <div className="border-t border-gray-800/50">
                    <div className="max-w-3xl mx-auto px-6 py-2">
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {suggestions.slice(0, 5).map((s, i) => (
                                <button key={i} onClick={() => handleSend(s.text)} disabled={loading}
                                    className={`px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap flex-shrink-0 transition cursor-pointer disabled:opacity-50 ${catColors[s.category] || "border-gray-700 text-gray-400 hover:bg-gray-800"}`}>
                                    {s.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex gap-3 items-center">
                        <input ref={inputRef} type="text" value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your call data..."
                            disabled={loading}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition text-sm disabled:opacity-50"
                        />
                        <button onClick={() => handleSend()} disabled={loading || !input.trim()}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                            {loading ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : "Send"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
