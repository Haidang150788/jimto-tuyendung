"use client";

import { ShieldCheck, Sparkles, GraduationCap } from "lucide-react";
import { useSiteContent } from "@/lib/site-content-context";

const FEATURE_ICONS = [ShieldCheck, Sparkles, GraduationCap];

export function AboutSection() {
  const { content } = useSiteContent();
  const { about } = content;

  return (
    <section id="gioi-thieu" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            {about.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-black sm:text-3xl">
            {about.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-black/50">{about.subtitle}</p>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-black/60">
          {about.description}
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {about.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-black/5 p-6 text-center"
              >
                <Icon className="mx-auto size-8 text-brand" />
                <h3 className="mt-4 text-base font-bold text-black">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/50">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
