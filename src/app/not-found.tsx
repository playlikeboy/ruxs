import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FFE8DD] text-accent flex items-center justify-center font-bold text-2xl mb-4 font-mono">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-muted max-w-sm mb-6">
        This link might have expired, been mistyped, or moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2.5 bg-accent text-white text-xs font-semibold rounded-[10px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
      >
        Return to Home
      </Link>
    </div>
  );
}
