"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  CheckCheck, 
  Send, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  BellOff, 
  PauseCircle, 
  PlusCircle, 
  ShieldCheck, 
  Truck,
  RotateCcw
} from "lucide-react";

type SimulationMode = "whatsapp" | "runsheet";

export function ImpeccableSteering() {
  const [mode, setMode] = useState<SimulationMode>("whatsapp");
  const [milkQuantity, setMilkQuantity] = useState<number>(2);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ sender: "bot" | "user"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "Namaste Rohitji (Flat B-702)! 🥛 Tomorrow 06:00 AM delivery: 2x Cow Milk (500ml). Reply 'PAUSE' to skip or tap below.",
      time: "21:30",
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setHistory((prev) => [
        ...prev,
        { sender: "user", text: "Resume delivery", time: "21:42" },
        { sender: "bot", text: "✅ Resumed! 2x Cow Milk will be delivered by 06:15 AM tomorrow.", time: "21:42" },
      ]);
    } else {
      setIsPaused(true);
      setHistory((prev) => [
        ...prev,
        { sender: "user", text: "PAUSE tomorrow", time: "21:41" },
        { sender: "bot", text: "⏸️ Done! Delivery paused for tomorrow. ₹0 charged. Resumes automatically on Monday.", time: "21:41" },
      ]);
    }
  };

  const handleAddExtra = () => {
    const next = milkQuantity + 1;
    setMilkQuantity(next);
    setIsPaused(false);
    setHistory((prev) => [
      ...prev,
      { sender: "user", text: `Make it ${next} packets tomorrow`, time: "21:44" },
      { sender: "bot", text: `🥛 Updated! Delivery set to ${next}x Cow Milk (500ml) for tomorrow. Added to daily ledger.`, time: "21:44" },
    ]);
  };

  const handleReset = () => {
    setMilkQuantity(2);
    setIsPaused(false);
    setHistory([
      {
        sender: "bot",
        text: "Namaste Rohitji (Flat B-702)! 🥛 Tomorrow 06:00 AM delivery: 2x Cow Milk (500ml). Reply 'PAUSE' to skip or tap below.",
        time: "21:30",
      },
    ]);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");
    
    setHistory((prev) => [
      ...prev,
      { sender: "user", text, time: "21:45" },
      {
        sender: "bot",
        text: `🤖 RUXS NLP: Understood "${text}". Your B-702 morning routine is synchronized.`,
        time: "21:45",
      },
    ]);
  };

  return (
    <section id="steering" className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-[var(--c-border-subtle)] bg-[var(--c-canvas-subtle)]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--c-accent-soft)] border border-[var(--c-accent-border)] text-[var(--c-accent)] text-xs font-semibold mb-4">
            <span className="cc-led cc-led--emerald" />
            <span>ZERO APP FATIGUE · ZERO MORNING CALLS</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[var(--c-text-primary)] tracking-tight">
            Steered from WhatsApp. Fulfilled by 06:15 AM.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed">
            Residents don&apos;t need another buggy 80MB app with marketing push notifications. They steer their entire routine via natural WhatsApp replies before the 10:00 PM cutoff lock.
          </p>

          {/* Mode Switcher */}
          <div className="mt-8 inline-flex p-1 rounded-full bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] shadow-xs">
            <div className="ks-instrument-strip">
              <button
                type="button"
                onClick={() => setMode("whatsapp")}
                className={`ks-instrument-key ${mode === "whatsapp" ? "is-active" : ""}`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Resident View</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("runsheet")}
                className={`ks-instrument-key ${mode === "runsheet" ? "is-active" : ""}`}
              >
                <Truck className="w-3.5 h-3.5 text-coral-600" />
                <span>Top-Down Society Run Sheet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Simulator Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Visual Box (8 Cols) */}
          <div className="lg:col-span-7">
            {mode === "whatsapp" ? (
              <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-canvas)] shadow-md overflow-hidden">
                {/* WhatsApp Chat Chrome Header */}
                <div className="bg-[#075E54] text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-white text-sm shadow-inner">
                      R
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">RUXS Society Bot</span>
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-100 px-1.5 py-0.5 rounded-full font-mono">
                          Official
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-100/80 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        <span>Pre-Cutoff Automated Sync</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Reset Simulator"
                    className="p-1.5 rounded-md hover:bg-white/10 text-emerald-100 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat Messages Body */}
                <div className="p-4 sm:p-6 space-y-4 min-h-[320px] max-h-[380px] overflow-y-auto bg-[#EFEAE2]/50 text-xs sm:text-sm font-sans">
                  <div className="text-center my-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/80 shadow-xs text-[10px] font-mono text-[var(--c-text-muted)]">
                      TODAY · CUTOFF LOCK AT 22:00 IST
                    </span>
                  </div>

                  {history.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-xs ${
                          msg.sender === "user"
                            ? "bg-[#D9FDD3] text-[#111B21] rounded-tr-none"
                            : "bg-white text-[#111B21] rounded-tl-none border border-neutral-200/50"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-400 font-mono">
                          <span>{msg.time}</span>
                          {msg.sender === "user" && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Action Bar (Quick Actions) */}
                <div className="p-3 bg-[var(--c-canvas)] border-t border-[var(--c-border-subtle)]">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={handlePause}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 ${
                        isPaused
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-[var(--c-canvas-subtle)] text-[var(--c-text-primary)] hover:bg-[var(--c-surface)] border border-[var(--c-border-subtle)]"
                      }`}
                    >
                      <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isPaused ? "Undo Pause" : "Pause Tomorrow"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddExtra}
                      className="text-xs px-3 py-1.5 rounded-full font-medium bg-[var(--c-canvas-subtle)] text-[var(--c-text-primary)] hover:bg-[var(--c-surface)] border border-[var(--c-border-subtle)] transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+1 Extra Milk Packet</span>
                    </button>
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendCustom} className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type 'Pause until Sunday' or 'Add 20L can'..."
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-[var(--c-border-subtle)] bg-[var(--c-canvas-subtle)] focus:outline-none focus:border-[var(--c-accent)]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-[#128C7E] text-white hover:bg-[#075E54] transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              /* Run Sheet View */
              <div className="rounded-2xl border border-[var(--c-border-subtle)] bg-[var(--c-canvas)] shadow-md overflow-hidden">
                <div className="bg-[var(--c-surface)] px-5 py-4 border-b border-[var(--c-border-subtle)] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--c-text-primary)]">
                        Tower B — Run Sheet 06:00 AM
                      </span>
                      <span className="ks-tag ks-tag--emerald">Top-Down Optimized</span>
                    </div>
                    <p className="text-xs text-[var(--c-text-muted)] mt-0.5">
                      Elevator loads to 14th Floor once; vendor delivers downwards sequentially
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[var(--c-text-primary)]">
                      34 Drops · 18 Mins
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-[var(--c-border-subtle)] text-xs">
                  <div className="p-3.5 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-emerald-200 text-emerald-900 font-mono font-bold flex items-center justify-center text-[11px]">
                        14
                      </span>
                      <div>
                        <div className="font-semibold text-[var(--c-text-primary)]">Flat B-1402 · Door Hook</div>
                        <div className="text-[11px] text-[var(--c-text-muted)]">2x Amul Gold · Delivered 06:03 AM</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <CheckCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-emerald-200 text-emerald-900 font-mono font-bold flex items-center justify-center text-[11px]">
                        11
                      </span>
                      <div>
                        <div className="font-semibold text-[var(--c-text-primary)]">Flat B-1104 · Milk Box</div>
                        <div className="text-[11px] text-[var(--c-text-muted)]">1x Cow Milk + Morning Marigold</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                      <CheckCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>

                  <div className="p-3.5 bg-amber-50/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-amber-200 text-amber-900 font-mono font-bold flex items-center justify-center text-[11px]">
                        07
                      </span>
                      <div>
                        <div className="font-semibold text-[var(--c-text-primary)]">Flat B-702 (Rohit) · Bag</div>
                        <div className="text-[11px] text-[var(--c-text-muted)]">
                          {isPaused ? "⏸️ PAUSED via WhatsApp — Skip" : `${milkQuantity}x Cow Milk (500ml)`}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold ${isPaused ? "text-amber-700" : "text-blue-700"}`}>
                      {isPaused ? "Auto-Skipped" : "In Progress"}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-md bg-neutral-100 text-neutral-800 font-mono font-bold flex items-center justify-center text-[11px]">
                        03
                      </span>
                      <div>
                        <div className="font-semibold text-[var(--c-text-primary)]">Flat B-301 · Stand</div>
                        <div className="text-[11px] text-[var(--c-text-muted)]">20L Bisleri Water Can (Asset #W-419)</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">Queued</span>
                  </div>
                </div>

                <div className="p-3 bg-[var(--c-canvas-subtle)] text-[11px] text-[var(--c-text-muted)] flex items-center justify-between border-t border-[var(--c-border-subtle)]">
                  <span>DPDP Masked: Delivery boy only sees Flat # & Items (no phone numbers)</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            )}
          </div>

          {/* Side Narrative & Guarantees (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[var(--c-accent)]" />
                <h3 className="font-semibold text-sm text-[var(--c-text-primary)]">
                  10:00 PM Strict Cutoff Rule
                </h3>
              </div>
              <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
                At exactly 22:00 IST, tomorrow&apos;s manifest freezes. Vendors get aggregated batch counts on WhatsApp and plan exact procurement. No 2 AM phone calls, no morning arguments over what was ordered.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <BellOff className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-[var(--c-text-primary)]">
                  Zero Doorbell Guarantee
                </h3>
              </div>
              <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
                Items are placed silently on door hooks, baskets, or milk boxes between 05:30 AM and 06:15 AM. Your family sleeps peacefully without barking dogs or doorbell rings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--c-canvas)] border border-[var(--c-border-subtle)] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-coral-600" />
                <h3 className="font-semibold text-sm text-[var(--c-text-primary)]">
                  Digital Khata Ledger
                </h3>
              </div>
              <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
                Every packet, pause, or refill is recorded with integer paise precision. A single itemized bill arrives on the 1st of every month with UPI 1-tap settlement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
