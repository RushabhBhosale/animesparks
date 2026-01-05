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

const dataPath = path.join(__dirname, 'anime-list.json')
const entries = JSON.parse(fs.readFileSync(dataPath, 'utf8'))

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const toDocuments = () => {
  const used = new Set()
  return entries.map((entry) => {
    let base = slugify(entry.title)
    if (!base) base = 'anime'
    let id = `anime-${base}`
    let i = 1
    while (used.has(id)) {
      i += 1
      id = `anime-${base}-${i}`
    }
    used.add(id)
    return {
      _id: id,
      _type: 'animeEntry',
      title: entry.title,
      score: entry.score,
    }
  })
}

const chunk = (arr, size) => {
  const output = []
  for (let i = 0; i < arr.length; i += size) {
    output.push(arr.slice(i, i + size))
  }
  return output
}

const run = async () => {
  const docs = toDocuments()
  const batches = chunk(docs, 50)

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index]
    const transaction = client.transaction()
    batch.forEach((doc) => transaction.createOrReplace(doc))
    await transaction.commit()
    console.log(`Imported batch ${index + 1}/${batches.length}`)
  }

  console.log(`Done. Imported ${docs.length} anime entries.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
