"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
    content: string;
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Headings
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
                
                // Paragraphs
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                
                // Bold/italic
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                
                // Lists
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-300">{children}</li>,
                
                // Code
                code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                        return (
                            <code className="bg-gray-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                {children}
                            </code>
                        );
                    }
                    return (
                        <code className="block bg-gray-800 rounded-lg p-3 text-xs font-mono overflow-x-auto mb-2" {...props}>
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => <pre className="mb-2">{children}</pre>,
                
                // Tables
                table: ({ children }) => (
                    <div className="overflow-x-auto mb-2">
                        <table className="min-w-full text-xs border border-gray-700 rounded">{children}</table>
                    </div>
                ),
                thead: ({ children }) => <thead className="bg-gray-800">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
                tr: ({ children }) => <tr className="hover:bg-gray-800/50">{children}</tr>,
                th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-gray-300">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-gray-400">{children}</td>,
                
                // Blockquote
                blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-emerald-500/50 pl-3 italic text-gray-400 mb-2">{children}</blockquote>
                ),
                
                // Horizontal rule
                hr: () => <hr className="border-gray-700 my-3" />,
                
                // Links
                a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                        {children}
                    </a>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
