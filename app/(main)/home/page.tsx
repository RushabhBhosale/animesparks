// app/page.tsx
import { blogsQuery } from "@/sanity/blogQueries";
import { client } from "@/sanity/lib/client";
import Link from "next/link";

type Blog = {
  _id: string;
  title: string;
  slug: string;
  publishedAt: string;
  mainImage?: {
    asset?: { url: string };
    alt?: string;
  };
  categories?: { title: string; slug: string }[];
};

export default async function Home() {
  const blogs: Blog[] = await client.fetch(blogsQuery);

  if (!blogs?.length) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm text-neutral-600">No posts yet.</p>
      </main>
    );
  }

  const [featured, ...rest] = blogs;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Featured Blog */}
      <section className="mb-12">
        <Link
          href={`/blog/${featured.slug}`}
          className="group block overflow-hidden rounded-2xl border border-neutral-200"
        >
          {featured.mainImage?.asset?.url ? (
            <img
              src={featured.mainImage.asset.url}
              alt={featured.mainImage.alt || featured.title}
              className="h-72 w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : null}

          <div className="p-6">
            <div className="mb-2 flex flex-wrap gap-2">
              {featured.categories?.slice(0, 2).map((cat) => (
                <span
                  key={cat.slug}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700"
                >
                  {cat.title}
                </span>
              ))}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {featured.title}
            </h1>

            <p className="mt-2 text-sm text-neutral-600">
              Latest featured post
            </p>
          </div>
        </Link>
      </section>

      {/* Latest Blogs */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-900">
          Latest Posts
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.slice(0, 6).map((blog) => (
            <Link
              key={blog._id}
              href={`/blog/${blog.slug}`}
              className="group rounded-xl border border-neutral-200 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <h3 className="line-clamp-2 text-base font-semibold text-neutral-900 group-hover:underline">
                {blog.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                {new Date(blog.publishedAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
