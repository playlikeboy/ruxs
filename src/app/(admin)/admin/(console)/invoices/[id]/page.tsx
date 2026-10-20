import { notFound } from "next/navigation";
import { getAdminInvoiceDetail } from "@/features/invoices/queries";
import { InvoicePrintableView } from "@/features/invoices/components/invoice-printable-view";

export const metadata = { title: "Invoice Details · Admin" };

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getAdminInvoiceDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <InvoicePrintableView
        invoice={detail.invoice}
        vendor={detail.vendor}
        customer={detail.customer}
        entries={detail.entries}
      />
    </div>
  );
}
