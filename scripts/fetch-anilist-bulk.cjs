const path = require('path')
const fs = require('fs')
const {createClient} = require('@sanity/client')

const loadEnvFile = (filename) => {
  if (!fs.existsSync(filename)) return
  const content = fs.readFileSync(filename, 'utf8')
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

loadEnvFile(path.join(process.cwd(), '.env.local'))

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-12-29'
const token = process.env.SANITY_WRITE_TOKEN

if (!dataset || !projectId || !token) {
  console.error('Missing env vars. Set NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_PROJECT_ID, and SANITY_WRITE_TOKEN.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const endpoint = 'https://graphql.anilist.co'
const query = `query ($search: String) {
  Media(search: $search, type: ANIME) {
    coverImage { large }
    bannerImage
    genres
    seasonYear
    startDate { year }
  }
}`

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchAniList = async (title) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {search: title},
    }),
  })

  if (!response.ok) {
    throw new Error(`AniList request failed (${response.status})`)
  }

  const payload = await response.json()
  return payload?.data?.Media || null
}

const run = async () => {
  const entries = await client.fetch(
    `*[_type == "animeEntry"] | order(title asc) {
      _id,
      title,
      coverImage,
      bannerImage,
      genres,
      year
    }`
  )

  let updated = 0
  let skipped = 0

  for (const entry of entries) {
    const title = (entry.title || '').trim()
    if (!title) {
      skipped += 1
      continue
    }

    const needsFetch =
      !entry.coverImage &&
      !entry.bannerImage &&
      (!Array.isArray(entry.genres) || entry.genres.length === 0) &&
      !entry.year

    if (!needsFetch) {
      skipped += 1
      continue
    }

    try {
      const media = await fetchAniList(title)

      if (!media) {
        skipped += 1
        continue
      }

      const update = {}
      if (!entry.coverImage && media.coverImage?.large) {
        update.coverImage = media.coverImage.large
      }
      if (!entry.bannerImage && media.bannerImage) {
        update.bannerImage = media.bannerImage
      }
      if (
        (!Array.isArray(entry.genres) || entry.genres.length === 0) &&
        Array.isArray(media.genres)
      ) {
        update.genres = media.genres
      }
      if (!entry.year && (media.seasonYear || media.startDate?.year)) {
        update.year = media.seasonYear || media.startDate.year
      }

      if (Object.keys(update).length) {
        await client.patch(entry._id).set(update).commit()
        updated += 1
      } else {
        skipped += 1
      }
    } catch (error) {
      console.error(`Failed for ${title}`)
    }

    await delay(250)
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
