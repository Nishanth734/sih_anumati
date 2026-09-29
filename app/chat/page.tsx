"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  RefreshCw,
  Trash2,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Flame,
  Wind,
  Factory,
  ShieldCheck,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";

interface ICitation {
  chunkId: string;
  title: string;
  sourceRule: string;
}

interface IChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ICitation[];
  createdAt: string;
}

const SECTOR_PROMPTS: Record<string, string[]> = {
  Boiler: [
    "What are the hydrostatic pressure test requirements for boiler registration?",
    "What safety valve calibration rules apply under Indian Boiler Regulations?",
    "What competency certificate is needed for a First Class boiler attendant?",
  ],
  Pollution: [
    "How is chimney stack height calculated for Consent to Establish (CTE)?",
    "What are the discharge parameter limits for ETP effluent water?",
    "What are the storage and manifest rules for hazardous waste?",
  ],
  FactoryLicense: [
    "What distance margins are required for factory floor plan approval?",
    "How often must the Structural Stability Certificate be renewed?",
    "What worker welfare facilities are required for 250 workers?",
  ],
};

export default function StatutoryChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [sector, setSector] = useState<"Boiler" | "Pollution" | "FactoryLicense">("Boiler");
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryQuery, setRetryQuery] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; reset: number } | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<ICitation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Fetch user chat history on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const safetyTimer = setTimeout(() => {
      if (isMounted && initialLoading) {
        setInitialLoading(false);
      }
    }, 5000);

    const fetchChatHistory = async () => {
      try {
        // Auth session verification
        const meRes = await fetch("/api/auth/me", { signal: controller.signal });
        const meData = await meRes.json();

        if (!meRes.ok || !meData.success || !meData.data?.user) {
          router.push("/login?callbackUrl=/chat");
          return;
        }

        const res = await fetch("/api/chat", { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data.success && data.data && isMounted) {
          if (data.data.sector) {
            setSector(data.data.sector);
          }
          if (Array.isArray(data.data.messages)) {
            setMessages(data.data.messages);
          }
        }
      } catch (err: any) {
        console.warn("Failed to load chat history:", err);
      } finally {
        clearTimeout(timeoutId);
        clearTimeout(safetyTimer);
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    fetchChatHistory();

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
      clearTimeout(safetyTimer);
    };
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle Query Submission
  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || loading) return;

    setError(null);
    setRetryQuery(null);
    setInputQuery("");
    setLoading(true);

    // Optimistic UI update: add user query immediately
    const tempUserMsg: IChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for AI response

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, sector }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/chat");
          return;
        }
        if (res.status === 429) {
          setError(`Rate limit reached: ${data.error}`);
          if (data.resetSeconds) {
            setRateLimitInfo({ remaining: 0, reset: data.resetSeconds });
          }
        } else {
          setError(data.error || "Failed to process RAG chat query. Please try again.");
        }
        setRetryQuery(query);
        // Remove temp user message on error so user can retry cleanly
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        setLoading(false);
        return;
      }

      if (data.rateLimit) {
        setRateLimitInfo(data.rateLimit);
      }

      const assistantMessage: IChatMessage = data.data.message;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("AI Service Timeout: Statutory assistant response took longer than 15 seconds.");
      } else {
        setError("Network connection error. Failed to reach ANUMATI statutory AI service.");
      }
      setRetryQuery(query);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Handle Clear History
  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your statutory compliance chat history?")) return;
    try {
      await fetch("/api/chat", { method: "DELETE" });
      setMessages([]);
      setError(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getSectorIcon = (sec: string) => {
    switch (sec) {
      case "Boiler":
        return <Flame className="w-4 h-4 text-amber-500" />;
      case "Pollution":
        return <Wind className="w-4 h-4 text-emerald-500" />;
      default:
        return <Factory className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gov-navy rounded-xl text-gov-gold shadow-md shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              ANUMATI Statutory RAG Assistant
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Sector Verified
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict statutory compliance Q&A trained on Indian Boilers Act, Water/Air Pollution Acts & Factory Laws.
            </p>
          </div>
        </div>

        {/* Controls: Sector Selector & Clear History */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 pl-1">
              {getSectorIcon(sector)} Sector:
            </span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as any)}
              className="bg-white text-xs font-bold text-slate-800 px-2.5 py-1 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-gov-navy"
            >
              <option value="Boiler">Boiler Licensing</option>
              <option value="Pollution">Pollution Control Board</option>
              <option value="FactoryLicense">Factory Registration</option>
            </select>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear Chat History"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
        {/* Messages Window */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {initialLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading statutory knowledge base...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full border border-amber-200">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Ask ANUMATI Statutory Assistant ({sector} Sector)
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Answers are generated strictly from statutory rules and acts with full rule citations.
                </p>
              </div>

              {/* Quick Prompt Pills */}
              <div className="w-full max-w-lg pt-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Suggested Statutory Queries
                </p>
                <div className="flex flex-col gap-2">
                  {SECTOR_PROMPTS[sector]?.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs bg-white hover:bg-slate-100 p-3 rounded-lg border border-slate-200 shadow-sm text-slate-700 font-medium transition flex items-center justify-between group"
                    >
                      <span>"{prompt}"</span>
                      <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-gov-blue transition" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gov-navy text-gov-gold flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gov-navy text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-none space-y-3"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-[11px] text-slate-500">
                      <span className="font-bold text-gov-navy flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ANUMATI Statutory Response
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {/* Statutory Citations Section */}
                  {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-gov-blue" /> Referenced Statutory Rules ({msg.citations.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setSelectedCitation(cit)}
                            className="text-[11px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md transition flex items-center gap-1.5"
                          >
                            <span className="font-bold text-amber-700">[{cit.sourceRule}]</span>
                            <span className="text-amber-800 max-w-[180px] truncate">{cit.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-amber-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-sm mt-1 font-bold text-xs">
                    You
                  </div>
                )}
              </div>
            ))
          )}

          {/* Thinking / Loading Indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-gov-navy text-gov-gold flex items-center justify-center shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none p-4 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-gov-navy" />
                <span>Searching statutory knowledge base & running RAG synthesis...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Alert with Graceful Retry Option */}
        {error && (
          <div className="p-3 bg-red-50 border-t border-b border-red-200 text-red-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            {retryQuery && (
              <button
                onClick={() => handleSendMessage(retryQuery)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-semibold rounded text-xs transition shrink-0 flex items-center gap-1 shadow-sm"
              >
                <RefreshCw className="w-3 h-3" /> Retry Request
              </button>
            )}
          </div>
        )}

        {/* Rate Limit Warning */}
        {rateLimitInfo && rateLimitInfo.remaining === 0 && (
          <div className="px-4 py-2 bg-amber-50 text-amber-800 text-[11px] border-t border-amber-200 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Rate limit threshold reached. Please wait {rateLimitInfo.reset}s before issuing another query.</span>
          </div>
        )}

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask a statutory compliance question regarding ${sector} sector...`}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-gov-navy outline-none disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-2.5 bg-gov-navy hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5 text-gov-gold" /> Ask AI
            </button>
          </form>
        </div>
      </div>

      {/* Citation Detail Modal */}
      {selectedCitation && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-gov-navy px-5 py-3.5 text-white flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gov-gold" /> Statutory Reference Detail
              </h3>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-slate-300 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Statutory Source Rule</span>
                <p className="font-extrabold text-sm text-gov-navy mt-0.5">{selectedCitation.sourceRule}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Section Title</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedCitation.title}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Knowledge Chunk ID</span>
                <p className="font-mono text-slate-600 font-bold">{selectedCitation.chunkId}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedCitation(null)}
                className="px-4 py-1.5 bg-gov-navy text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
