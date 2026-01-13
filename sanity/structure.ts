import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Blog')
    .items([
      S.listItem()
        .title('Homepage Settings')
        .child(
          S.document()
            .schemaType('homepageSettings')
            .documentId('homepageSettings'),
        ),
      S.documentTypeListItem('post').title('Posts'),
      S.documentTypeListItem('category').title('Categories'),
      S.documentTypeListItem('author').title('Authors'),
      S.documentTypeListItem('animeEntry').title('Anime List'),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          item.getId() &&
          !['post', 'category', 'author', 'animeEntry', 'homepageSettings'].includes(
            item.getId()!,
          ),
      ),
    ])
