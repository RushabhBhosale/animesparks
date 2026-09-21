import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const destination = new URL(request.url);
  destination.pathname = `/es/blog/${encodeURIComponent(slug)}`;

  return NextResponse.redirect(destination, 301);
}
