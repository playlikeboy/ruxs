import { Suspense } from "react";
import { HexclaveHandler } from "@hexclave/next";

export const dynamic = "force-dynamic";

export default async function Handler(props: {
  params: Promise<{ hexclave: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted">Authenticating…</div>}>
      <HexclaveHandler fullPage={false} params={params} searchParams={searchParams} />
    </Suspense>
  );
}
