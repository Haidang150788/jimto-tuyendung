"use client";

import { useSiteContent } from "@/lib/site-content-context";

export function Hero() {
  const { content } = useSiteContent();
  const { hero } = content;

  return (
    <section
      className="relative overflow-hidden py-12 text-white sm:py-16"
      style={{
        background: "linear-gradient(160deg, #f66a9c 0%, #ec4176 55%, #c62457 100%)",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/15" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
          {hero.headingLine1}
          <br />
          {hero.headingLine2}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 sm:text-base">
          {hero.subtitle}
        </p>
      </div>
    </section>
  );
}
