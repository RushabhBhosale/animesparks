import type { Metadata } from "next";

import {
  BlogPostPage,
  generateBlogMetadata,
} from "../_lib/blog-post-page";
import { getInitialBlogStaticParams } from "@/lib/content/blog-static-params";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getInitialBlogStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return generateBlogMetadata({ slug, locale: "en" });
}

export default async function BlogEnglishPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <BlogPostPage slug={slug} locale="en" />;
}
