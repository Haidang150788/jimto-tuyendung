"use client";

import { useSiteContent } from "@/lib/site-content-context";

const FOOTER_LINKS = [
  { label: "Việc Làm", href: "#viec-lam" },
  { label: "Giới Thiệu", href: "#gioi-thieu" },
  { label: "Giá Trị Cốt Lõi", href: "#gia-tri-cot-loi" },
  { label: "Chính sách bảo mật", href: "#" },
  { label: "Quy trình tuyển dụng", href: "#" },
];

export function Footer() {
  const { content } = useSiteContent();
  const { footer } = content;

  return (
    <footer className="mt-auto bg-[#1A1A1A] py-10 text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">{footer.tagline}</p>
            <p className="mt-1 text-xs text-white/50">
              {footer.address} &nbsp;|&nbsp; Hotline: {footer.hotline} &nbsp;|&nbsp; Email:{" "}
              {footer.email}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-white/40">{footer.copyright}</p>
      </div>
    </footer>
  );
}
