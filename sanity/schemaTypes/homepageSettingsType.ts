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
  ],
  preview: {
    select: {
      title: "title",
      count: "editorsPicks.length",
    },
    prepare({ title, count }) {
      return {
        title: title || "Homepage Settings",
        subtitle: count ? `${count} editors picks configured` : "No picks yet",
      };
    },
  },
});
