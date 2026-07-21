import { describe, expect, it } from "vitest";

import { AlreadyPublishedError, InternalLinkValidationError } from "./errors";
import { createBlogDraftSchema } from "./schemas";
import {
  createBlogDraft,
  getContentContext,
  isValidPublishKey,
  publishBlogDraft,
} from "./service";
import type {
  ChatGptBlogRepository,
  ImageImporter,
  PortableTextValue,
  SanityPostDocument,
  StoredPost,
} from "./types";

const baseUrl = "https://animesparks.com";

function publishedPost(overrides: Partial<StoredPost> = {}): StoredPost {
  return {
    _id: "post-watch-order",
    _type: "post",
    title: "Demon Slayer Watch Order: Series, Movies and OVAs",
    slug: "demon-slayer-watch-order",
    animeName: "Demon Slayer",
    articleType: "other",
    excerpt: "The complete Demon Slayer viewing order.",
    primaryKeyword: "demon slayer watch order",
    secondaryKeywords: ["demon slayer movies"],
    publishedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

class MemoryRepository implements ChatGptBlogRepository {
  readonly posts = new Map<string, StoredPost>();

  constructor(seed: StoredPost[] = []) {
    for (const post of seed) this.posts.set(post._id, post);
  }

  async listPosts() {
    return [...this.posts.values()];
  }

  async getEditorialReferences(_articleType: string, categorySlug?: string) {
    return {
      author: { _type: "reference" as const, _ref: "author-rushabh" },
      category: { _type: "reference" as const, _ref: `category-${categorySlug ?? "anime-opinions"}` },
    };
  }

  async createDraft(document: SanityPostDocument) {
    const stored = { ...document, slug: document.slug.current } as StoredPost;
    this.posts.set(stored._id, stored);
    return stored;
  }

  async getDraft(id: string) {
    return this.posts.get(`drafts.${id.replace(/^drafts\./, "")}`) ?? null;
  }

  async getPublished(id: string) {
    return this.posts.get(id.replace(/^drafts\./, "")) ?? null;
  }

  async publishDraft(id: string, publishedAt: string) {
    const canonical = id.replace(/^drafts\./, "");
    const draft = this.posts.get(`drafts.${canonical}`);
    if (!draft) throw new Error("missing draft");
    const published = { ...draft, _id: canonical, publishedAt };
    this.posts.delete(`drafts.${canonical}`);
    this.posts.set(canonical, published);
    return published;
  }
}

const successfulImageImporter: ImageImporter = {
  async importImage({ image, purpose, index }) {
    return {
      image: {
        _key: `image${index}`,
        _type: "image",
        asset: { _type: "reference", _ref: `image-asset-${purpose}-${index}` },
        alt: image.alt,
        sourceUrl: image.sourceUrl,
        ...(image.sourcePage ? { sourcePage: image.sourcePage } : {}),
        hostedUrl: `https://cdn.sanity.io/images/project/production/${purpose}-${index}.webp`,
        imagePurpose: purpose,
        ...(image.insertAfterHeading ? { insertAfterHeading: image.insertAfterHeading } : {}),
      },
      warnings: [],
    };
  },
};

const validDraftInput = {
  title: "Frieren Ending Explained: Why the Journey Matters",
  animeName: "Frieren",
  articleType: "explained" as const,
  excerpt: "A close reading of Frieren's ending and its emotional meaning.",
  content: "## The Journey Home\n\nFrieren reflects on memory, grief and time rather than treating immortality as a simple fantasy advantage. Her return to familiar places reveals how much meaning she missed while those moments were happening. Read our Demon Slayer watch order for another viewing guide.\n\nThe story makes its emotional argument through small gestures, remembered conversations and the distance between human and elven lives. Each memory changes how Frieren understands the companions who travelled beside her.\n\n## What the Ending Means\n\nThe ending turns distance into connection. It does not erase loss or pretend that every regret can be repaired. Instead, it shows why paying attention to people in the present matters, even when their lives seem brief from Frieren's perspective.\n\nThat choice gives the finale its restraint. The journey remains unfinished, but Frieren is no longer moving through it as the detached mage introduced at the beginning.",
  metaTitle: "Frieren Ending Explained: The Journey's Meaning",
  metaDescription: "Frieren's ending explained through memory, grief and the meaning of its long journey.",
  primaryKeyword: "frieren ending explained",
  secondaryKeywords: ["frieren ending meaning"],
  categorySlug: "anime-opinions",
  faq: [
    {
      question: "What does Frieren's ending mean?",
      answer: "The ending frames memory, grief and connection as the emotional meaning of Frieren's journey.",
    },
  ],
  internalLinks: [
    { text: "Demon Slayer watch order", url: `${baseUrl}/blog/demon-slayer-watch-order` },
  ],
  sources: [{ name: "Official Frieren website", url: "https://frieren-anime.jp/" }],
  heroImage: {
    sourceUrl: "https://images.example.com/frieren-hero.jpg",
    sourcePage: "https://example.com/frieren",
    alt: "Frieren standing beneath a night sky",
  },
  contentImages: [
    {
      sourceUrl: "https://images.example.com/frieren-memory.jpg",
      alt: "Frieren remembering her former party",
      insertAfterHeading: "The Journey Home",
    },
  ],
};

describe("Custom GPT blog integration", () => {
  it("completes context, draft, inspection, publish, and public URL flow", async () => {
    const repository = new MemoryRepository([publishedPost()]);
    const created = await createBlogDraft({
      input: validDraftInput,
      repository,
      imageImporter: successfulImageImporter,
      baseUrl,
    });
    expect(created.success).toBe(true);
    if (!created.success) throw new Error("draft was not created");
    expect(created.draft.status).toBe("draft");
    expect(created.draft.previewUrl).toContain("/studio/intent/edit/");

    const draft = await repository.getDraft(created.draft.id);
    expect(draft?.publishedAt).toBeUndefined();
    expect(draft).toMatchObject({
      author: { _type: "reference", _ref: "author-rushabh" },
      categories: [{ _type: "reference", _ref: "category-anime-opinions" }],
      faq: [{ _type: "faqItem", question: "What does Frieren's ending mean?" }],
    });
    expect((draft?.body as PortableTextValue).some((block) => block._type === "image")).toBe(true);
    const bodyBlocks = (draft?.body as PortableTextValue).filter((block) => block._type === "block");
    expect(bodyBlocks.some((block) => block.markDefs.some((definition) => definition.href.includes("demon-slayer-watch-order")))).toBe(true);

    const draftContext = await getContentContext(repository, { limit: 100, status: "draft" }, baseUrl);
    expect(draftContext.posts.map((post) => post.slug)).toContain(created.draft.slug);

    const published = await publishBlogDraft({
      id: created.draft.id,
      repository,
      baseUrl,
      now: () => new Date("2026-07-20T12:00:00.000Z"),
    });
    expect(published.post.url).toBe(`${baseUrl}/blog/${created.draft.slug}`);
    const live = await repository.getPublished(created.draft.id);
    expect(live?.publishedAt).toBe("2026-07-20T12:00:00.000Z");
  });

  it("filters compact content context by search, anime, and status", async () => {
    const repository = new MemoryRepository([
      publishedPost(),
      publishedPost({ _id: "drafts.frieren", title: "Frieren Ending", slug: "frieren-ending", animeName: "Frieren", publishedAt: undefined }),
    ]);
    const result = await getContentContext(repository, { search: "movies", animeName: "Demon Slayer", status: "published", limit: 10 }, baseUrl);
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({ id: "post-watch-order", status: "published" });
    expect(result.posts[0]).not.toHaveProperty("body");
    expect(result.published).toHaveLength(1);
    expect(result.drafts).toHaveLength(0);
  });

  it("finds published posts when animeName is not populated and search includes a new topic", async () => {
    const repository = new MemoryRepository([
      publishedPost({
        title: "Yhwach Is the Most Dangerous Villain Bleach Ever Created",
        slug: "yhwach-is-the-most-dangerous-villain-bleach-ever-created",
        animeName: undefined,
      }),
    ]);
    const result = await getContentContext(
      repository,
      { search: "Bleach The Calamity", animeName: "Bleach", status: "published", limit: 10 },
      "https://www.animesparks.blog",
    );
    expect(result.published).toMatchObject([
      {
        title: "Yhwach Is the Most Dangerous Villain Bleach Ever Created",
        url: "https://www.animesparks.blog/blog/yhwach-is-the-most-dangerous-villain-bleach-ever-created",
        status: "published",
      },
    ]);
  });

  it("detects duplicates across published posts and drafts", async () => {
    const repository = new MemoryRepository([publishedPost()]);
    const duplicate = await createBlogDraft({
      input: {
        ...validDraftInput,
        title: "Demon Slayer Watch Order: Movies, OVAs and Series",
        animeName: "Demon Slayer",
        articleType: "other",
        primaryKeyword: "demon slayer watch order",
        internalLinks: undefined,
      },
      repository,
      imageImporter: successfulImageImporter,
      baseUrl,
    });
    expect(duplicate).toMatchObject({ success: false, duplicate: true });
    expect(repository.posts.size).toBe(1);

    const draftRepository = new MemoryRepository([
      publishedPost({ _id: "drafts.pending-watch-order", publishedAt: undefined }),
    ]);
    const draftDuplicate = await createBlogDraft({
      input: {
        ...validDraftInput,
        title: "Demon Slayer Watch Order for Every Movie and OVA",
        animeName: "Demon Slayer",
        articleType: "other",
        primaryKeyword: "demon slayer watch order",
        internalLinks: undefined,
      },
      repository: draftRepository,
      imageImporter: successfulImageImporter,
      baseUrl,
    });
    expect(draftDuplicate).toMatchObject({ success: false, duplicate: true });
  });

  it("rejects invalid payloads", () => {
    const parsed = createBlogDraftSchema.safeParse({ ...validDraftInput, articleType: "rumor", title: "" });
    expect(parsed.success).toBe(false);
  });

  it("saves a draft and returns a warning when image ingestion fails", async () => {
    const repository = new MemoryRepository([publishedPost()]);
    const failingImporter: ImageImporter = {
      async importImage() {
        throw new Error("remote host unavailable");
      },
    };
    const result = await createBlogDraft({ input: validDraftInput, repository, imageImporter: failingImporter, baseUrl });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error("draft was not created");
    expect(result.imageWarnings).toEqual([
      "Hero image could not be downloaded or uploaded.",
      "Content image 1 could not be downloaded or uploaded.",
    ]);
    expect(await repository.getDraft(result.draft.id)).not.toBeNull();
  });

  it("rejects an incorrect publishing key", () => {
    expect(isValidPublishKey("wrong-key", "correct-long-key")).toBe(false);
    expect(isValidPublishKey("correct-long-key", "correct-long-key")).toBe(true);
  });

  it("prevents repeated publishing", async () => {
    const repository = new MemoryRepository([publishedPost({ _id: "already-live" })]);
    await expect(publishBlogDraft({ id: "already-live", repository, baseUrl })).rejects.toBeInstanceOf(AlreadyPublishedError);
  });

  it("rejects invented internal article URLs", async () => {
    const repository = new MemoryRepository([publishedPost()]);
    await expect(
      createBlogDraft({
        input: {
          ...validDraftInput,
          internalLinks: [{ text: "invented article", url: `${baseUrl}/blog/not-a-real-post` }],
        },
        repository,
        imageImporter: successfulImageImporter,
        baseUrl,
      }),
    ).rejects.toBeInstanceOf(InternalLinkValidationError);
  });

  it("normalizes published internal URLs before validation", async () => {
    const repository = new MemoryRepository([publishedPost()]);
    const result = await createBlogDraft({
      input: {
        ...validDraftInput,
        internalLinks: [{ text: "Demon Slayer watch order", url: `${baseUrl}/blog/demon-slayer-watch-order/?utm_source=gpt` }],
      },
      repository,
      imageImporter: successfulImageImporter,
      baseUrl,
    });
    expect(result.success).toBe(true);
  });
});
