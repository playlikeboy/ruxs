"use client";

import { useEffect, useState } from "react";

interface CutoffTimerProps {
  cutoffAt: string; // "10:00"
  shift: string;
}

export function CutoffTimer({ cutoffAt, shift }: CutoffTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isPassed, setIsPassed] = useState<boolean>(false);
  const [isWarning, setIsWarning] = useState<boolean>(false);

  useEffect(() => {
    function calculate() {
      // Current IST time
      const now = new Date();
      // IST offset is UTC+5:30
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const istNow = new Date(utcTime + 330 * 60000);

      const [cHourStr, cMinStr] = cutoffAt.split(":");
      const cHour = parseInt(cHourStr ?? "10", 10);
      const cMin = parseInt(cMinStr ?? "0", 10);

      const cutoffDate = new Date(istNow);
      cutoffDate.setHours(cHour, cMin, 0, 0);

      const diffMs = cutoffDate.getTime() - istNow.getTime();

      if (diffMs <= 0) {
        setIsPassed(true);
        setTimeLeft(`Cutoff passed at ${cutoffAt} IST`);
        setIsWarning(false);
      } else {
        setIsPassed(false);
        const diffMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;

        setIsWarning(diffMinutes <= 30);

        if (hours > 0) {
          setTimeLeft(`${hours}h ${mins}m left until cutoff`);
        } else {
          setTimeLeft(`${mins}m left until cutoff`);
        }
      }
    }

    calculate();
    const interval = setInterval(calculate, 30000);
    return () => clearInterval(interval);
  }, [cutoffAt]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
        isPassed
          ? "bg-[#FAFAF7] text-muted border-line"
          : isWarning
            ? "bg-[#FFF3C9] text-[#9A5B00] border-[#9A5B00]/20"
            : "bg-surface text-ink border-line"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isPassed ? "bg-muted" : isWarning ? "bg-[#9A5B00] animate-pulse" : "bg-good"
        }`}
      />
      <span className="capitalize">{shift}:</span>
      <span>{timeLeft}</span>
    </div>
  );
}
