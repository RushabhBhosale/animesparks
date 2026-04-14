import { TranslateIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const spanishPostType = defineType({
  name: "spanishPost",
  title: "Spanish Blog",
  type: "document",
  icon: TranslateIcon,
  fields: [
    defineField({
      name: "originalPost",
      title: "Original English Blog",
      type: "reference",
      to: [{ type: "post" }],
      description:
        "Optional. Select the English blog if you want to reuse its author, tags, image, categories, or publish date.",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Headline used for the Spanish route.",
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "title",
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
      description:
        "Optional. Leave blank to reuse the original English blog author when one is selected above.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description:
        "Optional. Leave blank to reuse tags from the original English blog.",
    }),
    defineField({
      name: "mainImage",
      type: "image",
      options: {
        hotspot: true,
      },
      description:
        "Optional. Leave blank to reuse the original English blog image.",
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alternative text",
        }),
      ],
    }),
    defineField({
      name: "categories",
      type: "array",
      of: [defineArrayMember({ type: "reference", to: { type: "category" } })],
      description:
        "Optional. Leave blank to reuse categories from the original English blog.",
    }),
    defineField({
      name: "publishedAt",
      type: "datetime",
      description:
        "Optional. Leave blank to reuse the original English blog publish date.",
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
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
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      originalTitle: "originalPost.title",
      media: "mainImage",
    },
    prepare(selection) {
      const { author, originalTitle, title } = selection;
      const subtitleParts = [
        "Spanish",
        author ? `by ${author}` : undefined,
        originalTitle ? `from ${originalTitle}` : undefined,
      ].filter(Boolean);

      return {
        ...selection,
        title: title || "Untitled Spanish Blog",
        subtitle: subtitleParts.join(" - "),
      };
    },
  },
});
