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
                  isCompleted ? "bg-emerald-500" : "border-l-2 border-dashed border-white/[0.15]"
                }`}
              />
            )}

            {/* Step Icon / Dot */}
            <div className="relative z-10 flex shrink-0">
              {isCompleted ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                  <Check size={14} className="stroke-[3]" />
                </div>
              ) : isCurrent ? (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/20 shadow-[0_0_16px_rgba(16,185,129,0.4)]">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.2] bg-white/[0.04]">
                  <div className="h-2 w-2 rounded-full bg-white/[0.2]" />
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex flex-1 items-center justify-between min-w-0 pt-0.5">
              <div>
                <p
                  className={`text-sm font-semibold tracking-tight ${
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                {step.subtitle && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.subtitle}</p>
                )}
              </div>
              {step.time && (
                <span className="shrink-0 text-xs font-mono font-medium text-muted-foreground">
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
