import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/cv/PrintButton";
import { SalesCvSheet } from "@/components/cv/SalesCvSheet";
import { verifyCvToken } from "@/lib/cv-link";
import { getSalesRecord } from "@/lib/lark";
import { toSalesCv } from "@/lib/sales-cv";

// Printable CV for one "Tư vấn bán hàng" application, opened from the
// "Đơn ứng tuyển" link Lark holds on each record (see cv-link.ts). Always
// read live from Lark so HR corrections there show up on the next open.

export const metadata: Metadata = {
  title: "Đơn ứng tuyển — Jim Tồ",
  robots: { index: false, follow: false },
};

export default async function CvPage({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { recordId } = await params;
  const { k } = await searchParams;
  if (!verifyCvToken(recordId, typeof k === "string" ? k : undefined)) notFound();

  const raw = await getSalesRecord(recordId);
  if (!raw) notFound();
  const cv = toSalesCv(raw);

  return (
    <main className="min-h-screen bg-[#f3e9ed] py-4 sm:py-8 print:bg-[#fff5f8] print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <p className="text-sm text-black/60">
          {cv.name || "Ứng viên"}
          {cv.submittedAt && <> · nộp lúc {cv.submittedAt}</>}
        </p>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-[210mm] shadow-lg print:max-w-none print:shadow-none">
        <SalesCvSheet cv={cv} />
      </div>
    </main>
  );
}
