"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { addTimeOff, removeTimeOff, saveAvailability, saveBookingSettings } from "@/features/bookings/actions";

const DAYS: { id: string; label: string }[] = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
];

interface Window {
  weekday: string;
  startTime: string;
  endTime: string;
}

const timeInput = "h-10 rounded-[10px] border border-line bg-surface px-2 text-sm tabular-nums";

export function WeeklyHoursEditor({ slug, initial }: { slug: string; initial: Window[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Window[]>(initial);
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<Window>) => setRules((r) => r.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const copyMonToWeekdays = () => {
    const mon = rules.filter((r) => r.weekday === "mon");
    if (!mon.length) return toast.error("Add Monday's hours first");
    const rest = rules.filter((r) => !["tue", "wed", "thu", "fri", "sat"].includes(r.weekday));
    setRules([...rest, ...["tue", "wed", "thu", "fri", "sat"].flatMap((d) => mon.map((m) => ({ ...m, weekday: d })))]);
  };

  return (
    <div className="space-y-3">
      <div className="divide-y divide-line overflow-hidden rounded-[14px] border border-line bg-surface">
        {DAYS.map((day) => {
          const windows = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.weekday === day.id);
          return (
            <div key={day.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start">
              <p className="w-28 shrink-0 pt-2 text-sm font-semibold text-ink">{day.label}</p>
              <div className="flex-1 space-y-2">
                {windows.length === 0 && <p className="pt-2 text-sm text-muted">Not available</p>}
                {windows.map(({ r, i }) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="time" aria-label={`${day.label} from`} value={r.startTime} onChange={(e) => update(i, { startTime: e.target.value })} className={timeInput} />
                    <span className="text-muted">to</span>
                    <input type="time" aria-label={`${day.label} until`} value={r.endTime} onChange={(e) => update(i, { endTime: e.target.value })} className={timeInput} />
                    <button type="button" aria-label="Remove window" onClick={() => setRules((all) => all.filter((_, j) => j !== i))} className="rounded-full p-2 text-muted hover:bg-bg hover:text-bad">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setRules((r) => [...r, { weekday: day.id, startTime: windows.length ? "17:00" : "06:00", endTime: windows.length ? "20:00" : "10:00" }])}
                className="flex h-9 shrink-0 items-center gap-1 self-start rounded-[10px] border border-line px-3 text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add hours
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await saveAvailability({ slug, rules });
              if (!res.ok) toast.error(res.error);
              else {
                toast.success("Weekly hours saved. Clients see the new times now.");
                router.refresh();
              }
            })
          }
          className="h-11 rounded-[10px] bg-accent px-5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save weekly hours"}
        </button>
        <button type="button" onClick={copyMonToWeekdays} className="h-11 rounded-[10px] border border-line px-4 text-sm font-semibold">
          Copy Monday to Tue–Sat
        </button>
      </div>
    </div>
  );
}

export function BookingSettingsForm({ slug, modes, noticeMinutes, cancelCutoffHours }: { slug: string; modes: string[]; noticeMinutes: number; cancelCutoffHours: number }) {
  const router = useRouter();
  const [m, setM] = useState(modes);
  const [notice, setNotice] = useState(String(noticeMinutes / 60));
  const [cutoff, setCutoff] = useState(String(cancelCutoffHours));
  const [pending, startTransition] = useTransition();
  const toggle = (id: string) => setM((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await saveBookingSettings({ slug, modes: m, noticeMinutes: Math.round(Number(notice) * 60), cancelCutoffHours: Math.round(Number(cutoff)) });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success("Booking settings saved");
            router.refresh();
          }
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {[
          { id: "home", label: "Home visits" },
          { id: "studio", label: "At my gym / clinic" },
          { id: "online", label: "Online (video)" },
        ].map((o) => (
          <label key={o.id} className={"flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-sm " + (m.includes(o.id) ? "border-ink bg-bg font-semibold" : "border-line")}>
            <input type="checkbox" checked={m.includes(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4 accent-[#BD4B2A]" />
            {o.label}
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Minimum notice (hours)
          <input inputMode="decimal" value={notice} onChange={(e) => setNotice(e.target.value)} className="mt-1 block h-10 w-full rounded-[10px] border border-line bg-surface px-3" />
        </label>
        <label className="text-sm font-medium">
          Free cancellation until (hours before)
          <input inputMode="numeric" value={cutoff} onChange={(e) => setCutoff(e.target.value)} className="mt-1 block h-10 w-full rounded-[10px] border border-line bg-surface px-3" />
        </label>
      </div>
      <button type="submit" disabled={pending} className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function toIsoIST(date: string, time: string) {
  return `${date}T${time}:00+05:30`;
}

export function TimeOffEditor({ slug, blocks }: { slug: string; blocks: { id: string; startsAt: string; endsAt: string; reason: string | null }[] }) {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [fromTime, setFromTime] = useState("00:00");
  const [to, setTo] = useState("");
  const [toTime, setToTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const fmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-3">
      {blocks.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface text-sm">
          {blocks.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span>
                {fmt.format(new Date(b.startsAt))} → {fmt.format(new Date(b.endsAt))}
                {b.reason ? <span className="text-muted"> · {b.reason}</span> : null}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await removeTimeOff({ slug, id: b.id });
                    if (!res.ok) toast.error(res.error);
                    else router.refresh();
                  })
                }
                className="text-xs font-semibold text-bad"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!from || !to) return toast.error("Pick both dates");
          startTransition(async () => {
            const res = await addTimeOff({ slug, startsAt: toIsoIST(from, fromTime), endsAt: toIsoIST(to, toTime), reason: reason || undefined });
            if (!res.ok) toast.error(res.error);
            else {
              toast.success("Time off added");
              setReason("");
              router.refresh();
            }
          });
        }}
      >
        <label className="text-xs font-medium">
          From
          <span className="mt-1 flex gap-1">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={timeInput + " flex-1"} />
            <input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} className={timeInput} />
          </span>
        </label>
        <label className="text-xs font-medium">
          Until
          <span className="mt-1 flex gap-1">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={timeInput + " flex-1"} />
            <input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} className={timeInput} />
          </span>
        </label>
        <label className="text-xs font-medium">
          Reason (optional)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Holiday" className={timeInput + " mt-1 w-full"} />
        </label>
        <button type="submit" disabled={pending} className="h-10 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60">
          Add time off
        </button>
      </form>
    </div>
  );
}
