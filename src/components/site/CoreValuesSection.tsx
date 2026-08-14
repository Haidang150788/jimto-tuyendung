"use client";

import { useSiteContent } from "@/lib/site-content-context";

export function CoreValuesSection() {
  const { content } = useSiteContent();
  const { coreValues } = content;

  return (
    <section id="gia-tri-cot-loi" className="bg-[#FAFAFA] py-16">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
          {coreValues.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-black/50">{coreValues.subtitle}</p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {coreValues.values.map((value) => (
            <div
              key={value.title}
              style={{ background: value.gradient }}
              className="flex flex-col justify-between rounded-2xl p-6 text-left text-white shadow-lg"
            >
              <h3 className="text-lg font-extrabold uppercase tracking-wide">
                {value.title}
              </h3>
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-sm font-bold italic leading-relaxed text-white">
                  &ldquo;{value.slogan}&rdquo;
                </p>
                <p className="text-sm leading-relaxed text-white/85">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
