"use client";

import Image from "next/image";
import { Phone } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-context";

export function FloatingButtons() {
  const { content } = useSiteContent();
  const telHref = `tel:${content.footer.hotline.replace(/[^\d]/g, "")}`;

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col gap-3">
      <a
        href="https://zalo.me"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat Zalo"
        className="flex size-12 items-center justify-center rounded-full bg-[#0068FF] shadow-lg transition-transform hover:scale-105"
      >
        <Image src="/images/zalo-icon.svg" alt="Zalo" width={26} height={26} />
      </a>
      <a
        href={telHref}
        aria-label="Gọi điện"
        className="flex size-12 items-center justify-center rounded-full bg-brand shadow-lg transition-transform hover:scale-105"
      >
        <Phone className="size-5 text-white" />
      </a>
    </div>
  );
}
