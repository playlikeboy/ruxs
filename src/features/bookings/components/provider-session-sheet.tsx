"use client";

import { useState } from "react";
import { Phone, MessageSquare, Sparkles } from "lucide-react";
import { formatSlotTime } from "@/core/booking";

interface SessionItem {
  booking: {
    id: string;
    number: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    mode: string;
    pricePaise: number;
    paymentMode: string;
  };
  customerName: string;
  customerPhone?: string;
  serviceName: string | null;
  category?: string | null;
}

export function ProviderSessionSheet({
  sessions,
  category,
}: {
  sessions: SessionItem[];
  category?: string | null;
}) {
  const [clientNotes, setClientNotes] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const getCategoryTheme = () => {
    switch (category) {
      case "fitness":
        return {
          title: "Trainer Session & Client Intake Log",
          badge: "Fitness & Strength",
          notePrompt: "e.g. Chest & Triceps, bench press 60kg x 8, watch left shoulder",
          goalLabel: "Workout Focus",
        };
      case "physio":
        return {
          title: "Clinical Rehab & Treatment Notes",
          badge: "Physiotherapy",
          notePrompt: "e.g. Cervical mobilization, ultrasound therapy, home isometric exercises",
          goalLabel: "Therapy Focus",
        };
      case "mehndi":
        return {
          title: "Mehndi Appointment & Design Roster",
          badge: "Mehndi Art",
          notePrompt: "e.g. Bridal Arabic floral, both hands up to elbows, organic henna cone",
          goalLabel: "Design Package",
        };
      default:
        return {
          title: "Client Appointment & Session Log",
          badge: "Appointments",
          notePrompt: "Add private notes about this client session…",
          goalLabel: "Session Notes",
        };
    }
  };

  const theme = getCategoryTheme();

  return (
    <div className="rounded-[18px] border border-line bg-surface p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">{theme.title}</h2>
            <p className="text-xs text-muted">Attendance tracking, client coordination &amp; session history</p>
          </div>
        </div>
        <span className="rounded-full bg-peach px-2.5 py-0.5 text-xs font-semibold text-accent">
          {theme.badge}
        </span>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center py-6 text-xs text-muted">No sessions scheduled for today.</p>
      ) : (
        <ul className="divide-y divide-line">
          {sessions.map(({ booking, customerName, customerPhone, serviceName }) => {
            const hasNotes = Boolean(clientNotes[booking.id]);

            return (
              <li key={booking.id} className="py-3.5 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink">
                        {formatSlotTime(new Date(booking.startsAt))} – {formatSlotTime(new Date(booking.endsAt))}
                      </span>
                      <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                        {booking.mode}
                      </span>
                    </div>
                    <p className="font-semibold text-sm text-ink mt-0.5">{customerName}</p>
                    <p className="text-xs text-muted">{serviceName ?? "Session"} · #{booking.number}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {customerPhone && (
                      <>
                        <a
                          href={`tel:${customerPhone}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-bg text-muted hover:text-ink transition"
                          title="Call client"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/91${customerPhone.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(customerName)},%20confirming%20our%20appointment%20with%20RUXs`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-good/10 text-good px-2.5 text-xs font-semibold transition hover:bg-good/20"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Session Notes Section */}
                <div className="rounded-[10px] bg-bg/80 p-2.5 text-xs border border-line/60">
                  <div className="flex items-center justify-between text-muted mb-1">
                    <span className="font-semibold text-[10px] uppercase">{theme.goalLabel}</span>
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === booking.id ? null : booking.id)}
                      className="text-accent hover:underline text-[11px] font-medium"
                    >
                      {editingId === booking.id ? "Done" : hasNotes ? "Edit note" : "+ Add note"}
                    </button>
                  </div>

                  {editingId === booking.id ? (
                    <input
                      type="text"
                      value={clientNotes[booking.id] ?? ""}
                      onChange={(e) =>
                        setClientNotes({ ...clientNotes, [booking.id]: e.target.value })
                      }
                      placeholder={theme.notePrompt}
                      className="h-8 w-full rounded-[6px] border border-line bg-surface px-2 text-xs text-ink placeholder:text-muted focus:border-ink focus:outline-none"
                    />
                  ) : (
                    <p className="text-ink/80 italic text-[11px]">
                      {clientNotes[booking.id] || "No notes logged for this session yet."}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
