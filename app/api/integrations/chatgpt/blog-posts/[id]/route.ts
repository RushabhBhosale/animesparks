import { commonIntegrationError, integrationJson, readLimitedJson } from "@/lib/integrations/chatgpt/http";
import { createSanityBlogRepository } from "@/lib/integrations/chatgpt/sanity";
import { updateBlogPostSchema } from "@/lib/integrations/chatgpt/schemas";
import { getBlogPost, updateBlogPost } from "@/lib/integrations/chatgpt/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPDATE_REQUEST_BYTES = 160_000;
const DOCUMENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function validDocumentId(id: string): boolean {
  return DOCUMENT_ID_PATTERN.test(id);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  void request;
  try {
    const { id } = await context.params;
    if (!validDocumentId(id)) {
      return integrationJson({ success: false, error: "Invalid blog post ID.", code: "INVALID_BLOG_POST_ID" }, { status: 400 });
    }
    return integrationJson(await getBlogPost({ id, repository: createSanityBlogRepository() }));
  } catch (error) {
    const response = commonIntegrationError(error);
    if (response) return response;
    console.error(
      "[chatgpt-integration] blog post read failed",
      JSON.stringify({ message: error instanceof Error ? error.message : String(error) }),
    );
    return integrationJson(
      { success: false, error: "Unable to load the blog post.", code: "BLOG_POST_READ_FAILED" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!validDocumentId(id)) {
      return integrationJson({ success: false, error: "Invalid blog post ID.", code: "INVALID_BLOG_POST_ID" }, { status: 400 });
    }
    const body = await readLimitedJson(request, MAX_UPDATE_REQUEST_BYTES);
    const parsed = updateBlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return integrationJson(
        { success: false, error: "Invalid blog update request.", code: "INVALID_REQUEST", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    return integrationJson(
      await updateBlogPost({ id, input: parsed.data, repository: createSanityBlogRepository() }),
      { status: 201 },
    );
  } catch (error) {
    const response = commonIntegrationError(error);
    if (response) return response;
    console.error(
      "[chatgpt-integration] blog post update failed",
      JSON.stringify({ message: error instanceof Error ? error.message : String(error) }),
    );
    return integrationJson(
      { success: false, error: "Unable to save the blog update draft.", code: "BLOG_POST_UPDATE_FAILED" },
      { status: 500 },
    );
  }
}
