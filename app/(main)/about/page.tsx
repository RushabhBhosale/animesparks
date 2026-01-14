import type { Metadata } from "next";
import Link from "next/link";
import { defaultOgImage, siteName } from "@/utils/seo";
import { ArrowRight, Eye, Brain, Skull, User } from "lucide-react";

export const metadata: Metadata = {
  title: "About AnimeSparks A Personal Anime Editorial Blog",
  description:
    "Learn about AnimeSparks a personal anime blog by Rushabh Bhosale focused on reviews lists character analysis and honest anime opinions.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About AnimeSparks A Personal Anime Editorial Blog",
    description:
      "Learn about AnimeSparks a personal anime blog by Rushabh Bhosale focused on reviews lists character analysis and honest anime opinions.",
    url: "/about",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About AnimeSparks A Personal Anime Editorial Blog",
    description:
      "Learn about AnimeSparks a personal anime blog by Rushabh Bhosale focused on reviews lists character analysis and honest anime opinions.",
    images: [defaultOgImage],
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-anime-ink text-anime-text overflow-x-hidden selection:bg-anime-lime selection:text-black">
      {/* HERO */}
      <header className="relative w-full pt-24 md:pt-40 pb-14 md:pb-20 px-4 md:px-8 overflow-hidden flex items-center">
        <div className="absolute top-0 right-0 w-2/3 h-full bg-anime-red/10 skew-x-12 z-0 pointer-events-none border-l border-anime-red/20" />
        <div className="absolute bottom-0 left-[-10%] w-1/2 h-1/2 bg-anime-lime/5 -skew-y-6 z-0 pointer-events-none rounded-full blur-3xl" />

        {/* big background word (smaller on mobile) */}
        <div className="absolute top-10 md:top-1/4 left-4 md:left-10 text-[6.5rem] md:text-[25rem] font-black text-white/5 select-none z-0 leading-none overflow-hidden whitespace-nowrap opacity-25">
          CHAOS
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12 items-center">
            <div className="lg:col-span-7 relative z-20">
              <div className="bg-black border border-anime-cyan px-3 md:px-4 py-1 inline-block -rotate-2 md:-rotate-3 mb-5 md:mb-6 shadow-[4px_4px_0px_#00f3ff]">
                <span className="text-anime-cyan font-black uppercase text-xs md:text-sm tracking-[0.28em] md:tracking-[0.3em]">
                  Personal Blog
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] md:leading-[0.85] tracking-tight md:tracking-tighter uppercase mb-6 md:mb-8">
                Behind <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-anime-red via-red-500 to-yellow-500">
                  The Sparks
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-2xl text-white/70 font-medium max-w-2xl leading-relaxed border-l-4 md:border-l-8 border-anime-red pl-4 md:pl-8 ml-0 md:ml-2">
                AnimeSparks is written by one person. No ghostwriters. No
                filler. Just real watch time turned into reviews, lists, and
                deep dives.
              </p>

              <div className="mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
                <Link
                  href="#writer"
                  className="w-full sm:w-auto bg-white text-black font-black uppercase tracking-wider px-6 md:px-8 py-3.5 md:py-4 text-xs md:text-sm md:hover:bg-anime-lime transition-colors shadow-hard md:hover:shadow-none md:hover:translate-x-1 md:hover:translate-y-1 text-center"
                >
                  Meet The Writer
                </Link>

                <Link
                  href="/blogs"
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white font-black uppercase tracking-wider px-6 md:px-8 py-3.5 md:py-4 text-xs md:text-sm md:hover:bg-white md:hover:text-black transition-colors text-center"
                >
                  Read the Blog <ArrowRight className="inline h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Keep this desktop-only (already was) */}
            <div className="lg:col-span-5 relative h-[600px] hidden lg:block">
              <div className="absolute top-10 right-10 w-64 h-64 border-4 border-dashed border-white/20 rounded-full animate-[spin_20s_linear_infinite]" />
              <div className="absolute bottom-20 left-0 w-32 h-32 bg-anime-red/20 backdrop-blur-sm z-10" />

              <div className="absolute inset-0 z-10 transform rotate-3 lg:hover:rotate-0 transition-transform duration-500">
                <div className="w-full h-full bg-black border-4 border-white overflow-hidden relative shadow-hard-green">
                  <div
                    className="absolute inset-0 bg-cover bg-center grayscale lg:hover:grayscale-0 transition-all duration-500"
                    style={{ backgroundImage: `url(/me.jpeg)` }}
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent h-1/2" />

                  <div className="absolute bottom-6 left-6 text-white">
                    <span className="block text-5xl font-black italic">
                      SOLO
                    </span>
                    <span className="text-anime-lime font-bold uppercase tracking-widest">
                      Author Mode
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 z-30 bg-anime-red text-white p-6 rounded-full font-black uppercase text-center text-xs leading-tight shadow-lg transform rotate-12">
                No
                <br />
                Filler
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MARQUEE (smaller on mobile) */}
      <div className="bg-anime-lime overflow-hidden py-3 md:py-4 transform -rotate-1 origin-left w-[105%] -ml-2 border-y-4 border-black z-20 relative shadow-lg">
        <div className="whitespace-nowrap flex gap-10 md:gap-12 animate-[marquee_18s_linear_infinite] [animation-name:marquee]">
          <span className="text-black font-black uppercase text-lg sm:text-2xl md:text-3xl italic tracking-widest">
            /// MISSION START /// DECODING CULTURE /// NO FILLER /// HONEST
            TAKES ///
          </span>
          <span className="text-black font-black uppercase text-lg sm:text-2xl md:text-3xl italic tracking-widest">
            /// MISSION START /// DECODING CULTURE /// NO FILLER /// HONEST
            TAKES ///
          </span>
          <span className="text-black font-black uppercase text-lg sm:text-2xl md:text-3xl italic tracking-widest">
            /// MISSION START /// DECODING CULTURE /// NO FILLER /// HONEST
            TAKES ///
          </span>
        </div>
      </div>

      <main className="relative w-full overflow-hidden">
        {/* MANIFESTO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-32 grid md:grid-cols-2 gap-10 md:gap-16 relative">
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase mb-8 md:mb-12 relative inline-block">
              Our <span className="text-outline-red">Manifesto</span>
              <span className="absolute -top-6 md:-top-8 -right-6 md:-right-8 text-6xl md:text-8xl text-white/10 -z-10 opacity-50">
                *
              </span>
            </h2>

            <div className="space-y-6 md:space-y-8 text-base md:text-lg font-medium text-white/65">
              <p>
                <span className="text-white font-bold text-xl md:text-2xl">
                  01.
                </span>{" "}
                Anime isn’t a genre. It’s a medium. I write to decode the craft,
                the themes, and the choices hiding inside every frame.
              </p>
              <p>
                <span className="text-white font-bold text-xl md:text-2xl">
                  02.
                </span>{" "}
                This site is supposed to feel alive. Loud typography, sharp
                borders, and a little chaos to match the medium.
              </p>
              <p>
                <span className="text-white font-bold text-xl md:text-2xl">
                  03.
                </span>{" "}
                No corporate tone. No fake hype. If it’s mid, I’ll say it. If
                it’s peak, I’ll say that too.
              </p>
            </div>

            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4">
              <Link
                href="/blogs"
                className="w-full sm:w-auto bg-anime-red text-white md:hover:text-black font-black uppercase tracking-wider px-6 md:px-8 py-3.5 md:py-4 text-xs md:text-sm md:hover:bg-anime-lime transition-all shadow-[8px_8px_0px_0px_#fff] md:hover:shadow-none md:hover:translate-x-1 md:hover:translate-y-1 text-center"
              >
                Read Articles
              </Link>

              <Link
                href="/categories"
                className="w-full sm:w-auto bg-black text-white font-black uppercase tracking-wider px-6 md:px-8 py-3.5 md:py-4 text-xs md:text-sm border-2 border-white/20 md:hover:border-anime-cyan md:hover:text-anime-cyan transition-colors text-center"
              >
                Browse Categories
              </Link>
            </div>
          </div>

          {/* right visual block: keep, but make it smaller on mobile */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-[520px] aspect-square border-2 border-white/20 p-2 transform rotate-1 md:rotate-2">
              <div className="w-full h-full bg-anime-panel relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] bg-cover opacity-30 md:group-hover:opacity-50 transition-opacity duration-500" />
                <div className="absolute inset-0 flex items-center justify-center px-4">
                  <h3 className="text-5xl sm:text-7xl md:text-9xl font-black text-white mix-blend-overlay uppercase text-center leading-none">
                    Solo
                    <br />
                    Ops
                  </h3>
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-anime-cyan animate-[slide_2s_ease-in-out_infinite] [animation-name:slide]" />
                <div className="absolute bottom-0 right-0 w-full h-1 bg-anime-red animate-[slide_2s_ease-in-out_infinite_reverse] [animation-name:slide]" />
              </div>
            </div>
          </div>
        </section>

        {/* CORE VALUES (less skew, smaller headings on mobile) */}
        <section className="bg-anime-text text-black py-16 md:py-24 border-y-8 border-black transform md:skew-y-2 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 transform md:-skew-y-2">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-4 md:gap-6">
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                Core <br />
                <span className="text-anime-red">Values</span>
              </h2>
              <div className="bg-black text-white px-4 py-2 font-mono text-xs md:text-sm uppercase transform md:rotate-3">
                System.Config.Values_Load()
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="border-4 border-black p-6 md:p-8 bg-white shadow-hard md:hover:-translate-y-2 transition-transform duration-300 group">
                <div className="size-14 md:size-16 bg-anime-red text-white flex items-center justify-center border-2 border-black mb-5 md:mb-6 text-3xl md:group-hover:rotate-12 transition-transform">
                  <Eye className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase mb-3 md:mb-4">
                  Visual Obsession
                </h3>
                <p className="font-medium text-black/80 text-sm md:text-base">
                  I pay attention to composition, animation choices, and the
                  stuff most recaps ignore.
                </p>
              </div>

              <div className="border-4 border-black p-6 md:p-8 bg-white shadow-hard-blue md:hover:-translate-y-2 transition-transform duration-300 group md:mt-12">
                <div className="size-14 md:size-16 bg-anime-cyan text-black flex items-center justify-center border-2 border-black mb-5 md:mb-6 text-3xl md:group-hover:-rotate-12 transition-transform">
                  <Brain className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase mb-3 md:mb-4">
                  Story First
                </h3>
                <p className="font-medium text-black/80 text-sm md:text-base">
                  Themes, writing, character logic. I care about what the story
                  is doing, not just what it looks like.
                </p>
              </div>

              <div className="border-4 border-black p-6 md:p-8 bg-white shadow-hard-green md:hover:-translate-y-2 transition-transform duration-300 group">
                <div className="size-14 md:size-16 bg-anime-lime text-black flex items-center justify-center border-2 border-black mb-5 md:mb-6 text-3xl md:group-hover:rotate-180 transition-transform duration-700">
                  <Skull className="h-6 w-6 md:h-7 md:w-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase mb-3 md:mb-4">
                  Honesty
                </h3>
                <p className="font-medium text-black/80 text-sm md:text-base">
                  No forced positivity. If something falls apart, I’ll call it
                  out and explain why.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SINGLE WRITER SECTION */}
        <section
          className="py-16 sm:py-24 md:py-32 max-w-[1600px] mx-auto px-4 sm:px-6"
          id="writer"
        >
          <div className="text-center mb-14 md:mb-24 relative">
            <h2 className="text-5xl sm:text-7xl md:text-[10rem] font-black text-white/5 uppercase absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-10 md:-top-24 whitespace-nowrap select-none">
              The Pilot
            </h2>
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase relative z-10">
              Meet The <span className="text-anime-red italic">Writer</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
            <div className="group relative lg:col-span-8">
              <div className="absolute inset-0 bg-anime-red transform translate-x-2 translate-y-2 md:translate-x-3 md:translate-y-3 border-2 border-white/20" />
              <div className="relative bg-anime-panel border-2 border-white/15 p-2 overflow-hidden md:hover:-translate-y-2 transition-transform duration-300">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6 h-[320px] sm:h-[380px] md:h-[420px] bg-black relative overflow-hidden border border-white/10">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 md:group-hover:scale-105 grayscale md:group-hover:grayscale-0"
                      style={{ backgroundImage: `url(/me.jpeg)` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 bg-white text-black font-black uppercase text-base sm:text-lg md:text-xl px-4 py-2 skew-x-12 -ml-2 mb-4 border border-black">
                      Rushabh_Bhosale
                    </div>

                    <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-black/70 border border-white/15 px-3 py-2">
                      <User className="h-4 w-4 text-anime-lime" />
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">
                        Solo Author
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-6 px-2 pb-4 md:pb-6">
                    <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
                      <span className="text-white/40 font-mono text-xs uppercase">
                        Role
                      </span>
                      <span className="text-anime-red font-black uppercase text-xs sm:text-sm">
                        Writer, Editor, Curator
                      </span>
                    </div>

                    <div className="space-y-3 font-mono text-xs uppercase">
                      <div className="flex items-center gap-2">
                        <span className="w-24 sm:w-28 text-white/55">
                          Watch Time
                        </span>
                        <div className="flex-grow bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-anime-red w-[92%] h-full" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 sm:w-28 text-white/55">
                          Drafts
                        </span>
                        <div className="flex-grow bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-anime-cyan w-[74%] h-full" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 sm:w-28 text-white/55">
                          Sleep
                        </span>
                        <div className="flex-grow bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                          <div className="bg-anime-lime w-[18%] h-full" />
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 md:mt-6 text-sm sm:text-base text-white/65 leading-relaxed">
                      I started AnimeSparks to write the kind of anime articles
                      I wanted to read: clean, sharp, and obsessed with detail.
                      No fluff intros. No “10/10 peak” spam. Just real thoughts,
                      explained properly.
                    </p>

                    <div className="mt-6 md:mt-8 flex flex-wrap gap-4">
                      <Link
                        href="/blogs"
                        className="w-full sm:w-auto bg-anime-red text-white md:hover:text-black font-black uppercase tracking-wider px-6 md:px-8 py-3.5 md:py-4 text-xs md:text-sm md:hover:bg-anime-lime transition-all shadow-[8px_8px_0px_0px_#fff] md:hover:shadow-none md:hover:translate-x-1 md:hover:translate-y-1 text-center"
                      >
                        Read My Latest
                      </Link>
                    </div>

                    <div className="mt-6 md:mt-8 border-t border-white/10 pt-5 flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
                        Writing Focus:
                      </span>
                      {[
                        "Reviews",
                        "Character Breakdowns",
                        "Lists",
                        "Hot Takes",
                      ].map((t) => (
                        <span
                          key={t}
                          className="border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.14em] text-white/75"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="relative bg-anime-panel border-2 border-white/15 p-5 sm:p-6 shadow-hard-white">
                <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />
                <h3 className="text-lg sm:text-xl font-black uppercase text-white mb-2">
                  What You’ll Get Here
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  <li className="flex gap-3">
                    <span className="text-anime-lime font-black">01</span>
                    <span>
                      Reviews that explain the “why”, not just a score.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-anime-cyan font-black">02</span>
                    <span>Deep dives into themes and character writing.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-anime-red font-black">03</span>
                    <span>Lists that feel curated, not copy-pasted.</span>
                  </li>
                </ul>
              </div>

              <div className="relative bg-anime-panel border-2 border-white/15 p-5 sm:p-6 shadow-hard-white">
                <div className="pointer-events-none absolute -top-3 right-6 h-6 w-20 rotate-[10deg] bg-white/10 border border-white/10" />
                <h3 className="text-lg sm:text-xl font-black uppercase text-white">
                  Newsletter
                </h3>
                <p className="mt-2 text-sm text-white/65">
                  I’ll email only when there’s something worth reading.
                </p>

                <form className="mt-4 space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full border-2 border-white/15 bg-black px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-anime-lime focus:outline-none focus:ring-1 focus:ring-anime-lime"
                  />
                  <button
                    type="submit"
                    className="w-full bg-anime-red text-white md:hover:text-black font-black uppercase tracking-wider px-6 md:px-8 py-3.5 md:py-4 text-xs md:text-sm md:hover:bg-[#ccff00]
                    transition-all duration-200 ease-out
                    shadow-[8px_8px_0px_0px_#fff]
                    md:hover:shadow-none md:hover:translate-x-1 md:hover:translate-y-1
                    active:translate-x-2 active:translate-y-2 active:shadow-none"
                  >
                    Subscribe Now
                  </button>
                </form>

                <p className="mt-3 text-xs text-white/40">
                  Zero spam. Only the good stuff.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto bg-anime-red relative p-1 transform rotate-0 md:rotate-1">
            <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-full h-full border-4 border-white z-0" />
            <div className="bg-black relative z-10 p-8 sm:p-10 md:p-20 text-center border border-white/20">
              <h2 className="text-3xl sm:text-4xl md:text-7xl font-black uppercase mb-5 md:mb-6 leading-none">
                Join the <span className="text-outline-red">Simulation</span>
              </h2>
              <p className="text-white/65 text-sm sm:text-base md:text-lg mb-8 md:mb-10 max-w-xl mx-auto">
                Got a recommendation, a correction, or a take you want me to
                dissect? Send it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto bg-white text-black font-black uppercase px-6 md:px-8 py-3.5 md:py-4 text-sm md:text-lg md:hover:bg-anime-lime transition-colors shadow-hard-green md:hover:shadow-none md:hover:translate-x-1 md:hover:translate-y-1 text-center"
                >
                  Message Me
                </Link>
                <Link
                  href="/blogs"
                  className="w-full sm:w-auto bg-transparent border-2 border-white text-white font-black uppercase px-6 md:px-8 py-3.5 md:py-4 text-sm md:text-lg md:hover:bg-white md:hover:text-black transition-colors text-center"
                >
                  Read Articles
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </main>
  );
}
