import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteContentProvider } from "@/lib/site-content-context";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SiteContentProvider>{children}</SiteContentProvider>
      </body>
    </html>
  );
}
