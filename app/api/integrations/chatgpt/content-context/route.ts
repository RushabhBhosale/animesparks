import { contentContextQuerySchema } from "@/lib/integrations/chatgpt/schemas";
import { commonIntegrationError, integrationJson } from "@/lib/integrations/chatgpt/http";
import { createSanityBlogRepository } from "@/lib/integrations/chatgpt/sanity";
import { getContentContext } from "@/lib/integrations/chatgpt/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const parsed = contentContextQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) {
    return integrationJson(
      { success: false, error: "Invalid content-context query.", code: "INVALID_QUERY", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  try {
    return integrationJson(await getContentContext(createSanityBlogRepository(), parsed.data));
  } catch (error) {
    const response = commonIntegrationError(error);
    if (response) return response;
    console.error(
      "[chatgpt-integration] content context failed",
      JSON.stringify({ message: error instanceof Error ? error.message : String(error) }),
    );
    return integrationJson(
      { success: false, error: "Unable to load content context.", code: "CONTENT_CONTEXT_FAILED" },
      { status: 500 },
    );
  }
}
