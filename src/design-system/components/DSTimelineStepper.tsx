"use client";

import React from "react";
import { Check } from "lucide-react";

export interface TimelineStep {
  id: string;
  title: string;
  subtitle?: string;
  time?: string;
  status: "completed" | "current" | "pending";
}

export interface DSTimelineStepperProps {
  steps: TimelineStep[];
  className?: string;
}

export function DSTimelineStepper({ steps, className = "" }: DSTimelineStepperProps) {
  return (
    <div className={`relative space-y-6 ${className}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isCompleted = step.status === "completed";
        const isCurrent = step.status === "current";

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Vertical connector line */}
            {!isLast && (
              <div
                className={`absolute left-[13px] top-[26px] bottom-[-24px] w-[2px] ${
                  isCompleted ? "bg-[#2E7D32]" : "border-l-2 border-dashed border-border-strong"
                }`}
              />
            )}

            {/* Step Icon / Dot */}
            <div className="relative z-10 flex shrink-0">
              {isCompleted ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2E7D32] text-white font-bold shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
              ) : isCurrent ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-action bg-coral/15 shadow-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-action animate-pulse" />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-band">
                  <div className="h-2 w-2 rounded-full bg-ink-subtle/40" />
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex flex-1 items-center justify-between min-w-0 pt-0.5">
              <div>
                <p
                  className={`text-sm font-semibold tracking-tight ${
                    isCompleted || isCurrent ? "text-ink" : "text-ink-muted"
                  }`}
                >
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className="mt-0.5 text-xs text-ink-muted">{step.subtitle}</p>
                )}
              </div>
              {step.time && (
                <span className="shrink-0 text-xs font-mono font-medium text-ink-subtle">
                  {step.time}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
