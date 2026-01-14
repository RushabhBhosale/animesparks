import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { writeClient } from "@/sanity/lib/writeClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIEW_COOKIE_TTL = 60 * 60 * 24; // 1 day

export async function POST(req: NextRequest) {
  try {
    const token = writeClient.config().token;
    if (!token) {
      console.error("[views] Missing SANITY_WRITE_TOKEN");
      return NextResponse.json(
        { ok: false, message: "Server misconfigured" },
        { status: 500 }
      );
    }

    const { slug } = await req.json();
    const cleanSlug = typeof slug === "string" ? slug.trim() : "";

    if (!cleanSlug) {
      return NextResponse.json(
        { ok: false, message: "Missing slug" },
        { status: 400 }
      );
    }

    const cookieName = `as_viewed_${encodeURIComponent(cleanSlug)}`;
    const cookieStore = await cookies();
    const alreadyViewed = cookieStore.get(cookieName);

    if (alreadyViewed) {
      return NextResponse.json({ ok: true, counted: false });
    }

    const post = await writeClient.fetch<{ _id: string | null }>(
      `*[_type == "post" && slug.current == $slug][0]{_id}`,
      { slug: cleanSlug },
      { cache: "no-store" }
    );

    if (!post?._id) {
      return NextResponse.json(
        { ok: false, message: "Post not found" },
        { status: 404 }
      );
    }

    await writeClient
      .patch(post._id)
      .setIfMissing({ viewCount: 0 })
      .inc({ viewCount: 1 })
      .commit({ autoGenerateArrayKeys: true });

    const res = NextResponse.json({ ok: true, counted: true });
    res.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: VIEW_COOKIE_TTL,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("[views] Unable to record view", error);
    return NextResponse.json(
      { ok: false, message: "Unable to record view" },
      { status: 500 }
    );
  }
}
