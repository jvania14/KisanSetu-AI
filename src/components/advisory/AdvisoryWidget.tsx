import { useState, useEffect } from "react";
import {
  Sparkles,
  Send,
  Mic,
  ArrowUpRight,
  ShieldAlert,
  Info,
  RotateCcw,
  BookOpen,
  MapPin,
  Droplets,
  Leaf,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { FarmLocation, FarmWeather } from "@/lib/weather";

interface AdvisoryWidgetProps {
  currentLocation?: FarmLocation | undefined;
  currentWeather?: FarmWeather | null | undefined;
  selectedCrop?: string | undefined;
  initialQuestion?: string | undefined;
  lang?: ("EN" | "हिं" | "ਪੰਜਾਬੀ" | "मराठी" | "বাংলা" | "தமிழ்") | undefined;
  onNavigate?: ((section: any) => void) | undefined;
  notify?: ((msg: string) => void) | undefined;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  contextUsed?: string;
}

export default function AdvisoryWidget({
  currentLocation,
  currentWeather,
  selectedCrop = "Wheat",
  initialQuestion = "",
  lang = "EN",
  onNavigate,
  notify = () => {},
}: AdvisoryWidgetProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro-1",
      role: "assistant",
      content:
        lang === "हिं"
          ? "नमस्ते! मैं आपका किसान सेतु कृषि सहायक हूँ। आप फसल सुरक्षा, खाद प्रबंधन, सिंचाई समय और मंडी रणनीतियों के बारे में पूछ सकते हैं।"
          : "Namaste! I am your KisanSetu farming decision assistant. Ask me about crop health, fertilizer dosing, irrigation scheduling, or market planning.",
      timestamp: "Just now",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // If initialQuestion updates from external caller
  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  // Voice input support using Web Speech API
  const handleVoiceInput = () => {
    const Speech =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!Speech) {
      notify("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new Speech();
      recognition.lang = lang === "हिं" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
          notify("Voice captured.");
        }
      };

      recognition.onerror = () => {
        notify("Could not detect clear speech. Please try speaking closer to the mic.");
      };

      recognition.start();
      notify(lang === "हिं" ? "सुन रहा हूँ... बोलिए" : "Listening... please speak now");
    } catch {
      notify("Microphone access was denied or failed.");
    }
  };

  const handleSend = async (customText?: string) => {
    const query = (customText || question).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);
    setLastError(null);

    // Build context payload
    const farmContext = {
      crop: selectedCrop,
      location: currentLocation ? `${currentLocation.name}, ${currentLocation.admin1 || ""}` : "Sonipat, Haryana",
      weather: currentWeather?.current
        ? `${Math.round(currentWeather.current.temperature)}°C, Humidity ${currentWeather.current.humidity}%, Wind ${Math.round(currentWeather.current.windSpeed)} km/h`
        : "Live weather not loaded",
      rainForecastNext3Days: currentWeather?.forecast?.slice(0, 3).map((d) => `${d.date}: ${d.rainfall}mm (${d.rainProbability ?? 0}%)`) ?? [],
    };

    try {
      // Attempt to invoke server chat endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: farmContext,
        }),
      });

      if (!response.ok) {
        // Read response error or status
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Server returned ${response.status}`);
      }

      const streamText = await response.text();
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: streamText,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        contextUsed: `${farmContext.crop} · ${farmContext.location}`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // AI provider unavailable / unconfigured
      setAiUnavailable(true);
      setLastError(
        "Live AI service is currently unconfigured in this environment (requires LOVABLE_API_KEY or OPENAI_API_KEY in .env). As per system instructions, responses are never simulated when the provider is unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      {/* Left: Chat & Conversation Interface */}
      <section className="flex flex-col rounded-3xl border border-[#dfe7dc] bg-white shadow-sm overflow-hidden min-h-[620px]">
        {/* Chat header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ea] bg-[#fbfdfa] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e6f3e4] text-[#247547]">
              <Sparkles size={22} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#143e2b]">
                Kisan AI · Multilingual Advisory Companion
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#738376]">
                <span className="flex items-center gap-1 font-semibold text-[#1f5636]">
                  <Leaf size={13} /> {selectedCrop}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {currentLocation?.name ?? "Sonipat, Haryana"}
                </span>
              </div>
            </div>
          </div>

          <span className="rounded-full bg-[#f1f6ef] px-3 py-1 text-[11px] font-bold text-[#356d47] border border-[#d6e5d3]">
            {lang === "हिं" ? "हिंदी सहायता" : "English Assistant"}
          </span>
        </div>

        {/* Messages Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6 bg-[#fafbf9]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-sm bg-[#145a37] text-white"
                    : "rounded-bl-sm border border-[#e2e9df] bg-white text-[#20402e]"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.contextUsed && (
                  <p className="mt-2 text-[10px] text-[#718677] border-t border-[#ebf0e8] pt-1">
                    Context: {m.contextUsed}
                  </p>
                )}
                <span
                  className={`mt-1 block text-right text-[10px] ${
                    m.role === "user" ? "text-white/70" : "text-[#8d9b90]"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Loading typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-[#e2e9df] bg-white px-4 py-3 text-xs text-[#52705e]">
                <Sparkles size={15} className="animate-spin text-[#2b794a]" />
                <span>Evaluating farm context & agronomic recommendations...</span>
              </div>
            </div>
          )}

          {/* AI Unconfigured / Unavailable Alert */}
          {aiUnavailable && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldAlert size={17} className="shrink-0 text-amber-700" />
                <span>AI Provider Unconfigured — No Simulation Fallback</span>
              </div>
              <p className="mt-2">
                {lastError}
              </p>
              <div className="mt-3 rounded-xl bg-white/80 p-3 font-mono text-[11px] text-amber-950 border border-amber-200">
                # To enable real AI responses, configure your API key in .env:<br />
                LOVABLE_API_KEY=your_key_here<br />
                # or OPENAI_API_KEY=your_key_here
              </div>
              <p className="mt-2 text-[11px] text-amber-900">
                In strict adherence to project standards, KisanSetu does not generate fabricated AI advice when credentials are absent.
              </p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-[#edf1ea] bg-white p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-end gap-2 rounded-2xl border border-[#dce5da] bg-[#fafbf9] p-2 focus-within:border-[#307d4f] focus-within:ring-2 focus-within:ring-[#d8eedb]"
          >
            <textarea
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                lang === "हिं"
                  ? "अपनी फसल, सिंचाई या मंडी से जुड़ा सवाल पूछें..."
                  : `Ask about ${selectedCrop} management, rain forecast, fertilizer dosage...`
              }
              className="max-h-32 min-h-12 flex-1 resize-y bg-transparent px-2 py-1.5 text-sm outline-none text-[#173b2b]"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice query (Microphone)"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ea] text-[#246b41] hover:bg-[#e2eedd]"
            >
              <Mic size={18} />
            </button>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#145a37] text-white shadow hover:bg-[#0f4429] disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>

          <p className="mt-2 px-1 text-[11px] text-[#78887b]">
            Telemetry context ({selectedCrop}, {currentLocation?.name ?? "Sonipat"}) is automatically provided with each request.
          </p>
        </div>
      </section>

      {/* Right: Suggested Prompts & Verified Crop Guidelines */}
      <aside className="space-y-4">
        {/* Suggested Starter Questions */}
        <div className="rounded-3xl border border-[#dfe7dc] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#143e2b] flex items-center gap-1.5">
            <BookOpen size={16} className="text-[#2b794a]" />
            Suggested Questions:
          </h3>
          <p className="mt-1 text-xs text-[#7b8a7e]">
            Tailored for {selectedCrop} in current season
          </p>

          <div className="mt-3.5 space-y-2">
            {[
              `What is the water requirement for ${selectedCrop} at flowering?`,
              `How should I manage yellow leaf spots on ${selectedCrop}?`,
              `What are the typical mandi transport costs in Haryana?`,
              `मेरी फसल के लिए खाद का सही समय क्या है?`,
            ].map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(q);
                  void handleSend(q);
                }}
                className="group flex w-full items-start justify-between rounded-xl border border-[#e4ebe0] p-2.5 text-left text-xs leading-4 text-[#33503e] hover:border-[#388556] hover:bg-[#f3f9f1]"
              >
                <span>{q}</span>
                <ArrowUpRight size={13} className="text-[#849688] group-hover:text-[#257343] shrink-0 mt-0.5 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Context Bridges */}
        <div className="rounded-3xl border border-[#dfe7dc] bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[#143e2b]">
            Connected Farm Tools
          </h3>
          <p className="mt-1 text-xs text-[#7b8a7e]">
            Cross-module contextual navigation
          </p>

          <div className="mt-3.5 space-y-2">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate("Crop Doctor")}
                  className="flex w-full items-center justify-between rounded-xl bg-[#f7faf5] p-2.5 text-xs font-semibold text-[#205134] hover:bg-[#edf5ea]"
                >
                  <span className="flex items-center gap-2">
                    <Leaf size={15} className="text-[#2b794a]" /> Crop Doctor (Photo)
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate("Smart Irrigation")}
                  className="flex w-full items-center justify-between rounded-xl bg-[#f7faf5] p-2.5 text-xs font-semibold text-[#205134] hover:bg-[#edf5ea]"
                >
                  <span className="flex items-center gap-2">
                    <Droplets size={15} className="text-[#2b794a]" /> Smart Irrigation Engine
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate("Mandi Insights")}
                  className="flex w-full items-center justify-between rounded-xl bg-[#f7faf5] p-2.5 text-xs font-semibold text-[#205134] hover:bg-[#edf5ea]"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#2b794a]" /> Mandi Intelligence
                  </span>
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
