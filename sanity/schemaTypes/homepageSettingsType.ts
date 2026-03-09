import { defineField, defineType } from "sanity";

export const homepageSettingsType = defineType({
  name: "homepageSettings",
  title: "Homepage Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      initialValue: "Homepage",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "editorsPicks",
      title: "Editors Picks",
      description: "Select the posts to feature in the Editors Picks rail.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: "moreBlogs",
      title: "More Blogs Rail",
      description:
        "Curate posts for the horizontal More Blogs section on the homepage.",
      type: "array",
      of: [{ type: "reference", to: [{ type: "post" }] }],
      validation: (Rule) => Rule.max(12),
    }),
  ],
  preview: {
    select: {
      title: "title",
      editorsCount: "editorsPicks.length",
      moreBlogsCount: "moreBlogs.length",
    },
    prepare({ title, editorsCount, moreBlogsCount }) {
      const editorsLabel = editorsCount
        ? `${editorsCount} editors picks`
        : "0 editors picks";
      const moreBlogsLabel = moreBlogsCount
        ? `${moreBlogsCount} more blogs`
        : "0 more blogs";

      return {
        title: title || "Homepage Settings",
        subtitle: `${editorsLabel} • ${moreBlogsLabel}`,
      };
    },
  },
});
