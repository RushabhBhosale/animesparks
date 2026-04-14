import type { Metadata } from "next";

import {
  BlogPostPage,
  generateBlogMetadata,
  generateBlogStaticParams,
} from "../../_lib/blog-post-page";

export const revalidate = 60;

export async function generateStaticParams() {
  return generateBlogStaticParams("es");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return generateBlogMetadata({ slug, locale: "es" });
}

export default async function BlogSpanishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BlogPostPage slug={slug} locale="es" />;
}
