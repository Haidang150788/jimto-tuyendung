import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { SiteContentProvider } from "@/lib/site-content-context";
import { getSiteContent } from "@/lib/site-content-store";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Tuyển dụng Jim Tồ - Chuyên Gia Của Bé",
  description:
    "Đồng hành cùng hàng triệu ba mẹ và trẻ em Việt Nam. Hãy gia nhập đội ngũ năng động của chúng tôi ngay hôm nay!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Render the real job list into the HTML instead of the template defaults
  // in site-content.ts. Before this, the page shipped DEFAULT_SITE_CONTENT
  // (fake "Trưởng nhóm C&B", ".NET Backend"...) and only swapped in the real
  // list after a client fetch — candidates whose in-app browser (Zalo/FB)
  // or slow network never finished that fetch were stuck on the fake list.
  await connection();
  const initialContent = await getSiteContent();

  return (
    <html lang="vi" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteContentProvider initialContent={initialContent}>{children}</SiteContentProvider>
      </body>
    </html>
  );
}
