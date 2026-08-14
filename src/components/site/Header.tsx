"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { label: "Việc Làm", href: "#viec-lam" },
  { label: "Giới Thiệu", href: "#gioi-thieu" },
  { label: "Giá Trị Cốt Lõi", href: "#gia-tri-cot-loi" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#" className="flex items-center gap-2">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={
                i === 0
                  ? "text-sm font-semibold text-brand"
                  : "text-sm font-medium text-black/70 transition-colors hover:text-brand"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-black/70 md:hidden"
          aria-label="Mở menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-black/5 bg-white px-4 py-3 md:hidden">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={
                i === 0
                  ? "rounded-md px-3 py-2 text-sm font-semibold text-brand"
                  : "rounded-md px-3 py-2 text-sm font-medium text-black/70"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
