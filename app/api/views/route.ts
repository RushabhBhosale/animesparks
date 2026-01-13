import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/writeClient";

const VIEW_COOKIE_TTL = 60 * 60 * 24; // 1 day

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { ok: false, message: "Missing slug" },
        { status: 400 }
      );
    }

    const cookieName = `as_viewed_${encodeURIComponent(slug)}`;
    const cookieStore = await cookies();
    const alreadyViewed = cookieStore.get(cookieName);

    if (alreadyViewed) {
      return NextResponse.json({ ok: true, counted: false });
    }

    const post = await client.fetch<{ _id: string | null }>(
      `*[_type == "post" && slug.current == $slug][0]{_id}`,
      { slug }
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
      maxAge: VIEW_COOKIE_TTL,
      path: "/",
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "Unable to record view" },
      { status: 500 }
    );
  }
}
