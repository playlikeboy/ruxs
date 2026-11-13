import { StoreBar } from "@/features/store/components/store-bag-link";

/** RUXs Store pages share the store bar (orders and bag with its count) under the Kids tabs. */
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreBar />
      {children}
    </>
  );
}
