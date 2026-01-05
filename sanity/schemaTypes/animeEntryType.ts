import {defineField, defineType} from 'sanity'

export const animeEntryType = defineType({
  name: 'animeEntry',
  title: 'Anime Entry',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Series Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'score',
      title: 'My Score',
      type: 'number',
      validation: (rule) => rule.min(0).max(10).precision(0).required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'url',
    }),
    defineField({
      name: 'bannerImage',
      title: 'Banner Image',
      type: 'url',
    }),
    defineField({
      name: 'genres',
      title: 'Genres',
      type: 'array',
      of: [{type: 'string'}],
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      score: 'score',
    },
    prepare({title, score}) {
      const safeTitle = title || 'Untitled'
      const subtitle = typeof score === 'number' ? `Score: ${score}` : 'No score'
      return {
        title: safeTitle,
        subtitle,
      }
    },
  },
})
