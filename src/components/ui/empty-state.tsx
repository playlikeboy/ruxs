import React from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: "dabba" | "can" | "list" | "bill";
}

export function EmptyState({
  title,
  description,
  action,
  icon = "list",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-line rounded-[12px] my-4">
      <div className="w-12 h-12 mb-3 text-muted flex items-center justify-center">
        {icon === "dabba" ? (
          <svg
            className="w-10 h-10 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="6" width="16" height="5" rx="2" />
            <rect x="4" y="11" width="16" height="5" rx="2" />
            <rect x="4" y="16" width="16" height="5" rx="2" />
            <path d="M12 2v4" />
            <path d="M10 2h4" />
          </svg>
        ) : icon === "can" ? (
          <svg
            className="w-10 h-10 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 6h10v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6z" />
            <path d="M9 2h6v4H9z" />
            <line x1="7" y1="11" x2="17" y2="11" />
            <line x1="7" y1="16" x2="17" y2="16" />
          </svg>
        ) : icon === "bill" ? (
          <svg
            className="w-10 h-10 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="8" y1="17" x2="12" y2="17" />
          </svg>
        ) : (
          <svg
            className="w-10 h-10 stroke-current fill-none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M9 12h6" />
          </svg>
        )}
      </div>
      <h3 className="text-base font-medium text-ink mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-4">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
