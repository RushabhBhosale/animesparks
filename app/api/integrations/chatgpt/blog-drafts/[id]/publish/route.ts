import { revalidatePath } from "next/cache";

import { AlreadyPublishedError, DraftNotFoundError } from "@/lib/integrations/chatgpt/errors";
import { commonIntegrationError, integrationJson, readLimitedJson } from "@/lib/integrations/chatgpt/http";
import { createSanityBlogRepository } from "@/lib/integrations/chatgpt/sanity";
import { publishBlogDraftSchema } from "@/lib/integrations/chatgpt/schemas";
import { isValidPublishKey, publishBlogDraft } from "@/lib/integrations/chatgpt/service";
import { getBaseUrl } from "@/utils/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PUBLISH_REQUEST_BYTES = 2_048;
const DOCUMENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!DOCUMENT_ID_PATTERN.test(id)) {
      return integrationJson(
        { success: false, error: "Invalid draft ID.", code: "INVALID_DRAFT_ID" },
        { status: 400 },
      );
    }
    const body = await readLimitedJson(request, MAX_PUBLISH_REQUEST_BYTES);
    const parsed = publishBlogDraftSchema.safeParse(body);
    if (!parsed.success) {
      return integrationJson(
        { success: false, error: "Invalid publish request.", code: "INVALID_REQUEST", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    if (!isValidPublishKey(parsed.data.publishKey)) {
      return integrationJson(
        { success: false, error: "Invalid publishing key.", code: "INVALID_PUBLISH_KEY" },
        { status: 401 },
      );
    }
    const result = await publishBlogDraft({ id, repository: createSanityBlogRepository() });
    const slug = new URL(result.post.url).pathname.split("/").filter(Boolean).at(-1);
    revalidatePath("/");
    revalidatePath("/blogs");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    if (slug) revalidatePath(`/blog/${slug}`);
    return integrationJson(result);
  } catch (error) {
    if (error instanceof AlreadyPublishedError) {
      return integrationJson(
        {
          success: false,
          alreadyPublished: true,
          message: error.message,
          post: {
            id: error.post.id,
            title: error.post.title,
            status: "published",
            url: `${getBaseUrl()}/blog/${error.post.slug}`,
          },
        },
        { status: 409 },
      );
    }
    if (error instanceof DraftNotFoundError) {
      return integrationJson(
        { success: false, error: error.message, code: "DRAFT_NOT_FOUND" },
        { status: 404 },
      );
    }
    const response = commonIntegrationError(error);
    if (response) return response;
    console.error(
      "[chatgpt-integration] publish failed",
      JSON.stringify({ message: error instanceof Error ? error.message : String(error) }),
    );
    return integrationJson(
      { success: false, error: "Unable to publish the draft.", code: "PUBLISH_FAILED" },
      { status: 500 },
    );
  }
}
