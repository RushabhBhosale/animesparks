import "server-only";

import { createClient } from "next-sanity";

import { IntegrationCmsError, IntegrationConfigurationError } from "./errors";
import type { ChatGptBlogRepository, SanityPostDocument, StoredPost } from "./types";

let integrationClient: ReturnType<typeof createClient> | null = null;

export function getIntegrationSanityClient(): ReturnType<typeof createClient> {
  if (integrationClient) return integrationClient;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const token = process.env.SANITY_WRITE_TOKEN?.trim();
  if (!projectId || !dataset) {
    throw new IntegrationConfigurationError("Sanity project configuration is missing.");
  }
  if (!token) {
    throw new IntegrationConfigurationError("SANITY_WRITE_TOKEN is not configured.");
  }
  integrationClient = createClient({
    projectId,
    dataset,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
    token,
    useCdn: false,
    perspective: "raw",
  });
  return integrationClient;
}

const POSTS_QUERY = `
*[
  _type == "post" &&
  defined(slug.current) &&
  !(_id in path("versions.**"))
] | order(coalesce(publishedAt, _updatedAt) desc)[0...1000] {
  ...,
  "slug": slug.current
}`;

function canonicalId(id: string): string {
  return id.replace(/^drafts\./, "");
}

function draftId(id: string): string {
  return `drafts.${canonicalId(id)}`;
}

function getSlug(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "current" in value && typeof value.current === "string") return value.current;
  return undefined;
}

function asStoredPost(value: unknown): StoredPost | null {
  if (!value || typeof value !== "object") return null;
  const post = value as Partial<StoredPost>;
  const slug = getSlug(post.slug);
  if (post._type !== "post" || typeof post._id !== "string" || typeof post.title !== "string" || !slug) {
    return null;
  }
  return { ...post, slug } as StoredPost;
}

function cmsError(message: string, error: unknown): IntegrationCmsError {
  return error instanceof IntegrationCmsError ? error : new IntegrationCmsError(message, { cause: error });
}

export function createSanityBlogRepository(): ChatGptBlogRepository {
  const client = getIntegrationSanityClient();
  return {
    async listPosts() {
      try {
        const posts = await client.fetch<unknown[]>(POSTS_QUERY, {}, { perspective: "raw", cache: "no-store" });
        return (posts ?? []).map(asStoredPost).filter((post): post is StoredPost => post !== null);
      } catch (error) {
        throw cmsError("Unable to read posts from Sanity.", error);
      }
    },
    async createDraft(document) {
      try {
        const created = await client.create(document, { visibility: "sync" });
        const post = asStoredPost(created);
        if (!post) throw new IntegrationCmsError("Sanity returned an invalid draft document.");
        return post;
      } catch (error) {
        throw cmsError("Unable to create the Sanity draft.", error);
      }
    },
    async getDraft(id) {
      try {
        return asStoredPost(await client.getDocument(draftId(id)));
      } catch (error) {
        throw cmsError("Unable to read the Sanity draft.", error);
      }
    },
    async getPublished(id) {
      try {
        return asStoredPost(await client.getDocument(canonicalId(id)));
      } catch (error) {
        throw cmsError("Unable to read the published Sanity post.", error);
      }
    },
    async publishDraft(id, publishedAt) {
      let source: SanityPostDocument | null;
      try {
        source = (await client.getDocument<SanityPostDocument>(draftId(id))) ?? null;
      } catch (error) {
        throw cmsError("Unable to read the Sanity draft for publishing.", error);
      }
      if (!source) throw new IntegrationCmsError("The Sanity draft disappeared before it could be published.");
      const {
        _rev: _revision,
        _createdAt: _created,
        _updatedAt: _updated,
        ...content
      } = source;
      void _revision;
      void _created;
      void _updated;
      const published = {
        ...content,
        _id: canonicalId(id),
        _type: "post" as const,
        publishedAt,
      } satisfies SanityPostDocument;
      try {
        await client
          .transaction()
          .createOrReplace(published)
          .delete(draftId(id))
          .commit({ visibility: "sync" });
        const normalized = asStoredPost(published);
        if (!normalized) throw new IntegrationCmsError("Sanity returned an invalid published document.");
        return normalized;
      } catch (error) {
        throw cmsError("Unable to publish the Sanity draft.", error);
      }
    },
  };
}
