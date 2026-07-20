import { createSanityImageImporter } from "@/lib/integrations/chatgpt/images";
import { commonIntegrationError, integrationJson, readLimitedJson } from "@/lib/integrations/chatgpt/http";
import { createSanityBlogRepository } from "@/lib/integrations/chatgpt/sanity";
import { createBlogDraftSchema } from "@/lib/integrations/chatgpt/schemas";
import { createBlogDraft } from "@/lib/integrations/chatgpt/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DRAFT_REQUEST_BYTES = 160_000;

export async function POST(request: Request) {
  try {
    const body = await readLimitedJson(request, MAX_DRAFT_REQUEST_BYTES);
    const parsed = createBlogDraftSchema.safeParse(body);
    if (!parsed.success) {
      return integrationJson(
        { success: false, error: "Invalid draft request.", code: "INVALID_REQUEST", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const result = await createBlogDraft({
      input: parsed.data,
      repository: createSanityBlogRepository(),
      imageImporter: createSanityImageImporter(),
    });
    return integrationJson(result, { status: result.success ? 201 : 409 });
  } catch (error) {
    const response = commonIntegrationError(error);
    if (response) return response;
    console.error(
      "[chatgpt-integration] draft creation failed",
      JSON.stringify({ message: error instanceof Error ? error.message : String(error) }),
    );
    return integrationJson(
      { success: false, error: "Unable to create the draft.", code: "DRAFT_CREATION_FAILED" },
      { status: 500 },
    );
  }
}
