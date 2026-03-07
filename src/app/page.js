"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#1A1A1A] pb-24 text-[#FFFFFF]">
      <main className="mx-auto flex max-w-md flex-col px-6 pt-8">
        {/* Header — Barlow Condensed + Barlow, dark theme */}
        <header className="mb-8 text-center">
          <h1 className="font-['Barlow_Condensed'] mb-2 text-3xl font-bold tracking-tight text-[#FFFFFF] sm:text-4xl">
            Personal Alert Button
          </h1>
          <p className="font-['Barlow'] mb-1 text-lg text-[#CCCCCC]">
            Press the button in case of emergency.
          </p>
          <p className="font-['Barlow'] text-sm text-[#888888]">
            紧急情况请按此按钮 | அவசரத்தில் இந்த பொத்தானை அழுத்துங்கள் |
            Tekan butang dalam kecemasan
          </p>
        </header>

        {/* Emergency Button — keep red for urgency, glow works on dark */}
        <section className="mb-10 flex flex-col items-center">
          <button
            type="button"
            onClick={() => router.push("/elders/recording")}
            className="flex min-h-[200px] min-w-[200px] flex-col items-center justify-center rounded-full border-[5px] border-white bg-[#C0392B] shadow-[0_0_0_2px_rgba(255,255,255,0.3),0_0_48px_24px_rgba(192,57,43,0.4),0_8px_24px_rgba(0,0,0,0.4)] transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5C400] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1A1A1A]"
            aria-label="Emergency - press for help"
          >
            <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white">
              <svg
                className="h-9 w-9 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M13 4h-2v11h2V4zm0 14h-2v2h2v-2z" />
              </svg>
            </span>
            <span className="font-['Barlow_Condensed'] text-lg font-bold tracking-wide text-white">
              EMERGENCY
            </span>
            <span className="font-['Barlow'] mt-1 text-xs font-medium text-white/95">
              紧急 | அவசரம் | Kecemasan
            </span>
          </button>
        </section>

        {/* How it works Card — dark card to match recording page */}
        <section className="rounded-2xl border border-[#3A3A3A] bg-[#111111] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <h2 className="font-['Barlow_Condensed'] mb-5 text-xl font-semibold text-[#FFFFFF]">
            How it works
          </h2>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="flex h-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400] text-sm font-bold text-black">
                1
              </span>
              <div>
                <span className="font-['Barlow'] font-semibold text-[#FFFFFF]">
                  Press the emergency button
                </span>
                <p className="font-['Barlow'] mt-0.5 text-sm leading-relaxed text-[#CCCCCC]">
                  When you need help, press the red button above.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400] text-sm font-bold text-black">
                2
              </span>
              <div>
                <span className="font-['Barlow'] font-semibold text-[#FFFFFF]">
                  Speak clearly
                </span>
                <p className="font-['Barlow'] mt-0.5 text-sm leading-relaxed text-[#CCCCCC]">
                  Tell us what&apos;s wrong in your preferred language.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-9 min-w-[36px] flex-shrink-0 items-center justify-center rounded-full bg-[#F5C400] text-sm font-bold text-black">
                3
              </span>
              <div>
                <span className="font-['Barlow'] font-semibold text-[#FFFFFF]">
                  Help is on the way
                </span>
                <p className="font-['Barlow'] mt-0.5 text-sm leading-relaxed text-[#CCCCCC]">
                  An operator will call you back immediately.
                </p>
              </div>
            </li>
          </ol>
        </section>

        {/* Bottom CTA — accent yellow to match recording page */}
        <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/95 to-transparent pt-12 pb-6">
          <button
            type="button"
            className="min-h-[56px] min-w-[220px] rounded-full bg-[#F5C400] px-8 font-['Barlow'] text-lg font-bold text-black shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5C400] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]"
            aria-label="Get help now"
          >
            Get help now
          </button>
        </div>
      </main>
    </div>
  );
}
