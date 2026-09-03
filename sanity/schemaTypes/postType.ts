import { DocumentTextIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const postType = defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Primary editorial headline used for the English route.",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
      },
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description: "Short editorial summary used by indexes and integrations.",
      validation: (Rule) =>
        Rule.required().min(1).max(500).warning("Required for new articles."),
    }),
    defineField({
      name: "animeName",
      title: "Anime name",
      type: "string",
      validation: (Rule) => Rule.required().warning("Required for new articles."),
    }),
    defineField({
      name: "articleType",
      title: "Article type",
      type: "string",
      options: {
        list: [
          { title: "Release date", value: "release-date" },
          { title: "News", value: "news" },
          { title: "Explained", value: "explained" },
          { title: "Characters", value: "characters" },
          { title: "Recommendation", value: "recommendation" },
          { title: "Review", value: "review" },
          { title: "Other", value: "other" },
        ],
      },
      validation: (Rule) => Rule.required().warning("Required for new articles."),
    }),
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      description: "SEO title shown in search results (50-60 characters).",
      validation: (Rule) =>
        Rule.max(60).warning("Aim for 60 characters or less."),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      description: "SEO description shown in search results (120-160 characters).",
      validation: (Rule) =>
        Rule.max(160).warning("Aim for 160 characters or less."),
    }),
    defineField({
      name: "author",
      type: "reference",
      to: { type: "author" },
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      validation: (Rule) =>
        Rule.min(1).max(12).warning("Add at least one useful franchise or intent tag."),
    }),
    defineField({
      name: "mainImage",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative text",
        }),
        defineField({ name: "sourceUrl", type: "url", title: "Original image URL" }),
        defineField({ name: "sourcePage", type: "url", title: "Image source page" }),
        defineField({ name: "hostedUrl", type: "url", title: "Hosted image URL" }),
        defineField({ name: "imagePurpose", type: "string", title: "Image purpose" }),
      ],
    }),
    defineField({
      name: "categories",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: { type: "category" } })],
      validation: (Rule) =>
        Rule.min(1).max(2).warning("Assign one or two editorial categories."),
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
    }),
    defineField({
      name: "updatedAt",
      title: "Updated at",
      type: "datetime",
      description:
        "Set when the article has been substantially updated after publishing. Shown to readers when it is newer than the publish date.",
    }),
    defineField({
      name: "updateHistory",
      title: "Update history",
      type: "array",
      description:
        "Reader-facing record of material editorial, factual, or source updates. Add an entry whenever a published article changes in a meaningful way.",
      of: [
        defineArrayMember({
          type: "object",
          name: "articleUpdate",
          fields: [
            defineField({
              name: "date",
              title: "Update date",
              type: "datetime",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "summary",
              title: "What changed",
              type: "string",
              validation: (Rule) => Rule.required().max(240),
            }),
          ],
          preview: {
            select: { title: "summary", subtitle: "date" },
          },
        }),
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
    }),
    defineField({
      name: "primaryKeyword",
      title: "Primary keyword",
      type: "string",
      validation: (Rule) => Rule.required().warning("Required for new articles."),
    }),
    defineField({
      name: "secondaryKeywords",
      title: "Secondary keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "internalLinks",
      title: "Validated internal links",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "internalLink",
          fields: [
            defineField({ name: "text", type: "string" }),
            defineField({ name: "url", type: "url" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "sources",
      title: "Article sources",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "articleSource",
          fields: [
            defineField({
              name: "name",
              type: "string",
              validation: (Rule) => Rule.required().warning("Name the source."),
            }),
            defineField({
              name: "url",
              type: "url",
              validation: (Rule) => Rule.required().warning("Add the source URL."),
            }),
          ],
        }),
      ],
      description:
        "Add sources for release dates, renewals, streaming details, and other factual status claims.",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const articleType = (context.document as { articleType?: string } | undefined)?.articleType;
          if (
            (articleType === "release-date" || articleType === "news") &&
            (!Array.isArray(value) || value.length === 0)
          ) {
            return "Add at least one source for release-date or news articles.";
          }
          return true;
        }).warning("Factual status articles should include at least one source."),
    }),
    defineField({
      name: "faq",
      title: "FAQ",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          fields: [
            defineField({ name: "question", type: "string" }),
            defineField({ name: "answer", type: "text" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "viewCount",
      title: "View Count",
      type: "number",
      readOnly: true,
      hidden: true,
      initialValue: 0,
    }),
    defineField({
      name: "integrationCreatedAt",
      title: "Integration creation time",
      type: "datetime",
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "mainImage",
    },
    prepare(selection) {
      const { author } = selection;
      return {
        ...selection,
        subtitle: author ? `by ${author}` : "English",
      };
    },
  },
});
