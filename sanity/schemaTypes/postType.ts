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
    }),
    defineField({
      name: "animeName",
      title: "Anime name",
      type: "string",
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
      name: "body",
      title: "Body",
      type: "blockContent",
    }),
    defineField({
      name: "primaryKeyword",
      title: "Primary keyword",
      type: "string",
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
            defineField({ name: "name", type: "string" }),
            defineField({ name: "url", type: "url" }),
          ],
        }),
      ],
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
