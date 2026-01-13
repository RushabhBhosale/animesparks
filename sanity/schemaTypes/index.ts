import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {animeEntryType} from './animeEntryType'
import {homepageSettingsType} from './homepageSettingsType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    categoryType,
    postType,
    authorType,
    animeEntryType,
    homepageSettingsType,
  ],
}
