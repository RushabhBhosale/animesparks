import { commonIntegrationError, integrationJson, readLimitedJson } from "@/lib/integrations/chatgpt/http";
import { createSanityBlogRepository } from "@/lib/integrations/chatgpt/sanity";
import { updateBlogPostByNameSchema } from "@/lib/integrations/chatgpt/schemas";
import { updateBlogPostByName } from "@/lib/integrations/chatgpt/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPDATE_REQUEST_BYTES = 160_000;

export async function PATCH(request: Request) {
  try {
    const body = await readLimitedJson(request, MAX_UPDATE_REQUEST_BYTES);
    const parsed = updateBlogPostByNameSchema.safeParse(body);
    if (!parsed.success) {
      return integrationJson(
        { success: false, error: "Invalid blog update request.", code: "INVALID_REQUEST", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    return integrationJson(
      await updateBlogPostByName({
        blogName: parsed.data.blogName,
        input: parsed.data,
        repository: createSanityBlogRepository(),
      }),
      { status: 201 },
    );
  } catch (error) {
    const response = commonIntegrationError(error);
    if (response) return response;
    console.error(
      "[chatgpt-integration] blog-name update failed",
      JSON.stringify({ message: error instanceof Error ? error.message : String(error) }),
    );
    return integrationJson(
      { success: false, error: "Unable to save the blog update draft.", code: "BLOG_POST_UPDATE_FAILED" },
      { status: 500 },
    );
  }
}
