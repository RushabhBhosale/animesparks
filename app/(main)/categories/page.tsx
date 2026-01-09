import Link from "next/link";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import { categoriesWithCountsQuery } from "@/sanity/blogQueries";
import { sanityImageUrl } from "@/sanity/lib/image";
import type { Metadata } from "next";
import { defaultOgImage, siteName } from "@/utils/seo";
import { splineSans } from "@/lib/font";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Anime Categories Reviews Lists and Genres",
  description:
    "Explore anime articles by category including shounen sports psychological romance and more on AnimeSparks.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Anime Categories Reviews Lists and Genres",
    description:
      "Explore anime articles by category including shounen sports psychological romance and more on AnimeSparks.",
    url: "/categories",
    type: "website",
    siteName,
    images: [{ url: defaultOgImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Categories Reviews Lists and Genres",
    description:
      "Explore anime articles by category including shounen sports psychological romance and more on AnimeSparks.",
    images: [defaultOgImage],
  },
};

type Category = {
  _id: string;
  title: string;
  slug: string;
  postCount?: number;
};

type CategoryWithCover = Category & {
  cover?: {
    title?: string;
    mainImage?: any;
  } | null;
};

const formatCount = (count?: number) => {
  if (!count) return "No posts";
  return count === 1 ? "1 post" : `${count} posts`;
};

// Pull a real image per category from a real post, no dummy URLs.
const categoriesWithCoversQuery = `
*[_type=="category"]|order(title asc){
  _id,
  title,
  "slug": slug.current,
  "postCount": count(*[_type=="post" && references(^._id)]),
  "cover": *[_type=="post" && references(^._id) && defined(mainImage.asset)]|order(publishedAt desc)[0]{
    title,
    mainImage
  }
}
`;

function pick<T>(arr: T[], idx: number): T | null {
  return arr[idx] ?? null;
}

export default async function CategoriesPage() {
  // If your existing categoriesWithCountsQuery is solid, keep it.
  // But for the exact UI (with real images), we need cover images too.
  let categories: CategoryWithCover[] = [];

  try {
    categories = await client.fetch<CategoryWithCover[]>(
      categoriesWithCoversQuery
    );
  } catch {
    // fallback to your existing query if needed
    const basic = await client.fetch<Category[]>(categoriesWithCountsQuery);
    categories = (basic || []).map((c) => ({ ...c, cover: null }));
  }

  const c0 = pick(categories, 0);
  const c1 = pick(categories, 1);
  const c2 = pick(categories, 2);
  const c3 = pick(categories, 3);

  const fandomChips = categories.slice(4, 8);
  const filterCats = categories.slice(0, 6);

  const musicCat = pick(categories, 8);
  const retroCat = pick(categories, 9);
  const randomCat = categories.length
    ? categories[categories.length - 1]
    : null;

  const bgFromCover = (cat: CategoryWithCover | null, width = 1600) => {
    if (!cat?.cover?.mainImage?.asset) return null;
    return sanityImageUrl(cat.cover.mainImage, { width, quality: 70 });
  };

  const ReviewsBg = bgFromCover(c0);
  const NewsBg = bgFromCover(c1);
  const AnalysisBg = bgFromCover(c2);
  const InterviewsBg = bgFromCover(c3);

  return (
    <main
      className={`${splineSans.className} bg-[#050505] text-[#f0f0f0] overflow-x-hidden selection:bg-[#ccff00] selection:text-black`}
    >
      {/* Global CSS utilities (kept local so you get exact look even if globals differ) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          ::-webkit-scrollbar{width:10px}
          ::-webkit-scrollbar-track{background:#050505}
          ::-webkit-scrollbar-thumb{background:#f20d0d;border:2px solid #050505}
          ::-webkit-scrollbar-thumb:hover{background:#ccff00}
          .text-outline{-webkit-text-stroke:1px white;color:transparent}
          .text-outline-red{-webkit-text-stroke:1px #f20d0d;color:transparent}
          .halftone-pattern{background-image:radial-gradient(#333 1px, transparent 1px);background-size:8px 8px}
          `,
        }}
      />

      {/* HERO */}
      <header className="relative w-full pt-40 pb-10 px-4 md:px-8 overflow-hidden min-h-[50vh] flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-3/4 h-full bg-[#f20d0d]/5 skew-x-12 z-0 pointer-events-none border-l border-white/5" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 halftone-pattern opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8">
            <div className="relative">
              <div className="absolute -left-20 -top-10 text-[10rem] font-black text-white/5 select-none z-0 leading-none overflow-hidden whitespace-nowrap hidden lg:block rotate-90 origin-bottom-left">
                INDEX
              </div>

              <h1 className="text-7xl md:text-9xl font-black leading-[0.8] tracking-tighter uppercase relative z-10 mix-blend-screen">
                Zone <br />
                <span className="text-outline-red ml-4 md:ml-24">Select</span>
              </h1>

              <div className="mt-6 flex flex-wrap gap-3 max-w-md">
                <span className="bg-gray-800 text-gray-400 text-[10px] uppercase px-2 py-1 font-mono tracking-widest border border-gray-700">
                  Database /// AnimeSparks
                </span>
                <span className="bg-gray-800 text-gray-400 text-[10px] uppercase px-2 py-1 font-mono tracking-widest border border-gray-700">
                  Access: Granted
                </span>
              </div>
            </div>

            {/* Signal Filter */}
            <div className="relative w-full md:w-auto p-6 border-2 border-white/20 bg-black/50 backdrop-blur-sm transform -rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="absolute -top-3 -right-3 size-4 bg-[#f20d0d] animate-pulse" />
              <div className="absolute -bottom-3 -left-3 size-4 bg-[#ccff00]" />

              <h3 className="font-bold uppercase text-xs tracking-[0.3em] mb-4 text-gray-400">
                Signal Filter
              </h3>

              <div className="flex flex-wrap gap-2 md:max-w-xs">
                <Link
                  prefetch={false}
                  href="/categories"
                  className="px-3 py-1 bg-white text-black font-black uppercase text-xs hover:bg-[#f20d0d] hover:text-white skew-x-12 transition-colors"
                >
                  All
                </Link>

                {filterCats.map((cat, i) => (
                  <Link
                    prefetch={false}
                    key={cat._id}
                    href={`/categories/${cat.slug}`}
                    className={[
                      "px-3 py-1 border border-white text-white font-bold uppercase text-xs skew-x-12 transition-colors",
                      i % 3 === 0
                        ? "hover:bg-[#00f3ff] hover:text-black hover:border-[#00f3ff]"
                        : i % 3 === 1
                          ? "hover:bg-[#ccff00] hover:text-black hover:border-[#ccff00]"
                          : "hover:bg-[#f20d0d] hover:text-white hover:border-[#f20d0d]",
                    ].join(" ")}
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="relative w-full overflow-hidden bg-[#050505] pb-12">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
            {/* REVIEWS (uses first real category) */}
            {c0 ? (
              <Link
                prefetch={false}
                href={`/categories/${c0.slug}`}
                className="md:col-span-8 group relative min-h-[400px] md:min-h-[500px] cursor-pointer"
              >
                <div className="absolute inset-0 bg-[#f20d0d] transform translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4 border border-white/20 z-0" />
                <div className="relative h-full bg-black border-2 border-[#f20d0d] z-10 overflow-hidden transition-transform duration-500 group-hover:-translate-y-1 group-hover:-translate-x-1">
                  {ReviewsBg ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-105 group-hover:scale-100"
                      style={{ backgroundImage: `url("${ReviewsBg}")` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-[#121212] to-black opacity-90" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  <div className="absolute top-0 right-0 p-4 border-l-2 border-b-2 border-[#f20d0d] bg-black/80">
                    <span className="text-[#f20d0d] text-4xl font-black">
                      ★
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                    <div className="overflow-hidden mb-2">
                      <span className="block text-[#ccff00] font-mono text-xs uppercase tracking-widest transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        Category /// {formatCount(c0.postCount)}
                      </span>
                    </div>

                    <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white group-hover:text-[#f20d0d] transition-colors leading-[0.85]">
                      {c0.title}
                    </h2>

                    <p className="mt-4 max-w-lg text-gray-300 text-sm md:text-base font-medium border-l-4 border-[#ccff00] pl-4">
                      Browse posts in {c0.title}.
                    </p>
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 pointer-events-none whitespace-nowrap">
                    <span className="text-9xl font-black text-outline">
                      VERDICT
                    </span>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* NEWS (uses second real category) */}
            {c1 ? (
              <Link
                prefetch={false}
                href={`/categories/${c1.slug}`}
                className="md:col-span-4 relative group cursor-pointer mt-12 md:mt-0"
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 to-black rounded-sm blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                <div className="relative h-full bg-[#1a1a1a] border-2 border-yellow-400 p-1 flex flex-col">
                  <div className="h-1/2 relative overflow-hidden bg-black border-b-2 border-yellow-400">
                    {NewsBg ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-500"
                        style={{ backgroundImage: `url("${NewsBg}")` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#121212] to-black" />
                    )}
                    <div className="absolute top-2 left-0 bg-yellow-400 text-black font-black text-xs px-2 py-0.5 uppercase transform -skew-x-12">
                      Breaking
                    </div>
                  </div>

                  <div className="h-1/2 p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 opacity-10 pointer-events-none">
                      <div className="whitespace-nowrap text-4xl font-black uppercase text-yellow-400">
                        News Flash /// Updates /// News Flash ///
                      </div>
                    </div>

                    <div>
                      <h2 className="text-5xl font-black uppercase text-white mb-2 group-hover:text-yellow-400 transition-colors">
                        {c1.title}
                      </h2>
                      <p className="text-xs text-gray-400 font-mono">
                        {formatCount(c1.postCount)}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <span className="text-4xl text-yellow-400 group-hover:rotate-45 transition-transform">
                        ↗
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* ANALYSIS (uses third real category) */}
            {c2 ? (
              <Link
                prefetch={false}
                href={`/categories/${c2.slug}`}
                className="md:col-span-5 relative group cursor-pointer min-h-[300px]"
              >
                <div className="h-full bg-[#121212] border border-gray-800 hover:border-[#00f3ff] transition-colors p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f3ff]/10 rounded-full blur-2xl" />

                  <div className="z-10 relative h-full flex flex-col justify-center items-start">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-3 bg-[#00f3ff] rounded-full animate-ping" />
                      <span className="text-[#00f3ff] font-mono text-xs uppercase tracking-[0.2em]">
                        Deep Dive
                      </span>
                    </div>

                    <h2 className="text-5xl md:text-6xl font-black uppercase text-white leading-none mb-4 mix-blend-overlay">
                      {c2.title}
                    </h2>

                    <p className="text-gray-400 text-sm max-w-xs relative z-10">
                      {formatCount(c2.postCount)}
                    </p>
                  </div>

                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#00f3ff]/50 pointer-events-none transition-colors" />

                  {AnalysisBg ? (
                    <div
                      className="absolute inset-0 z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-cover bg-center"
                      style={{ backgroundImage: `url("${AnalysisBg}")` }}
                    />
                  ) : null}
                </div>
              </Link>
            ) : null}

            {/* INTERVIEWS (uses fourth real category) */}
            {c3 ? (
              <Link
                prefetch={false}
                href={`/categories/${c3.slug}`}
                className="md:col-span-7 relative group cursor-pointer min-h-[300px]"
              >
                <div className="relative h-full w-full bg-[#f0f0f0] text-black p-1 transform md:rotate-1 group-hover:rotate-0 transition-transform duration-300 shadow-[8px_8px_0px_0px_rgba(242,13,13,1)]">
                  <div className="h-full border-2 border-black p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "radial-gradient(#000 2px, transparent 2px)",
                        backgroundSize: "10px 10px",
                      }}
                    />

                    <div className="relative z-10 flex-1">
                      <span className="bg-black text-white text-xs font-black uppercase px-2 py-1 rotate-2 inline-block mb-4">
                        Exclusive
                      </span>

                      <h2 className="text-5xl md:text-7xl font-black uppercase leading-[0.85] mb-4">
                        Inter
                        <br />
                        <span className="text-[#f20d0d] italic">views</span>
                      </h2>

                      <p className="font-bold text-sm leading-tight border-l-4 border-black pl-4">
                        {c3.title} /// {formatCount(c3.postCount)}
                      </p>
                    </div>

                    <div className="relative w-full md:w-1/2 h-48 md:h-full">
                      {InterviewsBg ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                          style={{
                            clipPath:
                              "polygon(10% 0, 100% 0, 100% 100%, 0% 100%)",
                            backgroundImage: `url("${InterviewsBg}")`,
                          }}
                        />
                      ) : (
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-black via-gray-700 to-black"
                          style={{
                            clipPath:
                              "polygon(10% 0, 100% 0, 100% 100%, 0% 100%)",
                          }}
                        />
                      )}

                      <div className="absolute -top-4 -left-4 bg-white border-2 border-black p-3 rounded-tl-xl rounded-br-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-6 z-20 group-hover:scale-110 transition-transform">
                        <span className="font-black text-xs uppercase">
                          "{c3.title}"
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* FANDOM STRIP (uses next real categories as chips) */}
            <div className="md:col-span-12 mt-8">
              <div className="relative bg-[#050505] border-y-4 border-gray-800 py-12 group cursor-pointer overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                  <h2 className="text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ccff00] via-white to-[#00f3ff] uppercase tracking-tighter mix-blend-difference group-hover:tracking-wide transition-all duration-500">
                    Fandom
                  </h2>

                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {fandomChips.length ? (
                      fandomChips.map((cat) => (
                        <Link
                          prefetch={false}
                          key={cat._id}
                          href={`/categories/${cat.slug}`}
                          className="bg-black border border-white px-4 py-2 rounded-full text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors"
                        >
                          {cat.title}
                        </Link>
                      ))
                    ) : (
                      <Link
                        prefetch={false}
                        href="/categories"
                        className="bg-black border border-white px-4 py-2 rounded-full text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors"
                      >
                        Browse Categories
                      </Link>
                    )}
                  </div>
                </div>

                <div className="absolute top-4 left-10 md:left-32 rotate-12 group-hover:rotate-45 transition-transform duration-500">
                  <div className="size-20 bg-[#f20d0d] rounded-full flex items-center justify-center text-black font-black text-xs text-center border-2 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
                    JOIN
                    <br />
                    US
                  </div>
                </div>

                <div className="absolute bottom-4 right-10 md:right-32 -rotate-12 group-hover:-rotate-45 transition-transform duration-500">
                  <span className="text-6xl text-[#ccff00] drop-shadow-[2px_2px_0_rgba(255,255,255,0.5)]">
                    🙂
                  </span>
                </div>
              </div>
            </div>

            {/* MUSIC (real category if available) */}
            {musicCat ? (
              <Link
                prefetch={false}
                href={`/categories/${musicCat.slug}`}
                className="md:col-span-3 mt-6 group cursor-pointer"
              >
                <div className="aspect-square bg-gray-900 border border-gray-700 hover:border-white transition-colors relative overflow-hidden flex items-center justify-center">
                  <span className="text-8xl text-gray-800 group-hover:text-white transition-colors duration-500 absolute scale-150">
                    ♪
                  </span>
                  <div className="relative z-10 bg-black/80 px-4 py-2 backdrop-blur-sm border border-gray-600">
                    <h3 className="font-black uppercase text-xl">
                      {musicCat.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ) : null}

            {/* RETRO ANIME (real category if available) */}
            {retroCat ? (
              <Link
                prefetch={false}
                href={`/categories/${retroCat.slug}`}
                className="md:col-span-6 mt-6 group cursor-pointer"
              >
                <div className="h-full min-h-[250px] bg-[#f20d0d] relative overflow-hidden flex items-center p-8 shadow-[8px_8px_0_0_#fff] hover:shadow-[4px_4px_0_0_#fff] hover:translate-x-1 hover:translate-y-1 transition-all">
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-black skew-x-12 translate-x-12 border-l-4 border-white" />
                  <div className="relative z-10 text-white mix-blend-difference">
                    <h3 className="text-5xl font-black uppercase leading-none">
                      {retroCat.title}
                    </h3>
                    <p className="font-mono text-xs mt-2 uppercase">
                      {formatCount(retroCat.postCount)}
                    </p>
                  </div>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 z-20">
                    <span className="text-6xl text-white">📹</span>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>

          <div className="text-center mt-24 opacity-50 hover:opacity-100 transition-opacity">
            <p className="font-mono text-xs text-[#f20d0d] uppercase tracking-[0.5em]">
              End of Index
            </p>
            <span className="text-4xl text-white">⇡</span>
          </div>
        </div>
      </main>
    </main>
  );
}
