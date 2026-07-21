# AnimeSparks Custom GPT integration

This integration lets a Custom GPT read compact post context, create Sanity drafts, and publish a selected draft after explicit confirmation. Content context and draft creation are intentionally public. Publishing requires a secret key. The public site URL is `https://www.animesparks.blog`.

## Endpoints

- `GET /api/integrations/chatgpt/content-context`
- `POST /api/integrations/chatgpt/blog-drafts`
- `POST /api/integrations/chatgpt/blog-drafts/{id}/publish`

The copy-ready Action definition is [animesparks-action.openapi.yaml](./animesparks-action.openapi.yaml). Recommended GPT instructions are in [custom-gpt-instructions.txt](./custom-gpt-instructions.txt).

## Environment variables

```env
NEXT_PUBLIC_SITE_URL=https://www.animesparks.blog
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_WRITE_TOKEN=your-sanity-editor-token
BLOG_PUBLISH_KEY=generate-a-long-random-secret
```

`SANITY_WRITE_TOKEN` needs permission to read drafts, create documents, upload image assets and publish documents. Keep both server-side secrets out of source control. Generate the publish key with `openssl rand -hex 32` and configure the same value in the private GPT's publish action input.

## Custom GPT setup

1. Deploy AnimeSparks with the environment variables above.
2. Open the private GPT editor and paste `custom-gpt-instructions.txt` into Instructions.
3. Add a new Action and paste `animesparks-action.openapi.yaml` as its schema.
4. Keep Action authentication set to None; this first version sends the publishing key only in the consequential publish request body.
5. Keep the GPT private and test context and draft creation first.
6. Review the Sanity draft and image rights manually before asking the GPT to publish.

The draft endpoint is deliberately unauthenticated. Anyone who discovers it can create unwanted Sanity drafts, although they cannot publish without `BLOG_PUBLISH_KEY`.

## Complete test example

Check context:

```bash
curl "http://localhost:3000/api/integrations/chatgpt/content-context?search=demon+slayer&limit=20"
```

Create a draft:

```bash
curl -X POST http://localhost:3000/api/integrations/chatgpt/blog-drafts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demon Slayer Season 5: What Could Come Next",
    "animeName": "Demon Slayer",
    "articleType": "release-date",
    "excerpt": "A factual look at what could follow Demon Slayer and what remains unconfirmed.",
    "content": "## What Is Confirmed\\n\\nDemon Slayer has continued through major theatrical and television releases, but this draft should distinguish official announcements from fan naming conventions. The article should state only details supported by the listed official source and clearly label everything else as analysis. That distinction matters because searches for a fifth season often combine confirmed adaptation plans with assumptions about how future material will be packaged.\\n\\n## Why the Season 5 Name Is Complicated\\n\\nFans commonly use season numbers to describe the next part of a long-running anime, even when the production committee uses movie titles or arc names instead. AnimeSparks should explain that terminology instead of turning it into a false confirmation. The useful question is not only whether a numbered season exists, but which manga material remains and what format has actually been announced.\\n\\n## What Could Come Next\\n\\nA careful outlook can compare the remaining story structure with earlier adaptation choices without assigning an unsupported date. Readers should leave with a clear separation between verified news, reasonable production context and speculation. Future announcements can then be added to the same article instead of creating a near-duplicate update.",
    "metaTitle": "Demon Slayer Season 5: What Could Come Next",
    "metaDescription": "What is known about Demon Slayer Season 5, what remains unconfirmed, and what could come next for the anime.",
    "primaryKeyword": "demon slayer season 5",
    "secondaryKeywords": ["demon slayer new season"],
    "internalLinks": [],
    "sources": [{"name":"Official Demon Slayer website","url":"https://kimetsu.com/anime/"}]
  }'
```

Inspect the returned `previewUrl` in Sanity Studio. Then publish only after review and explicit confirmation:

```bash
curl -X POST http://localhost:3000/api/integrations/chatgpt/blog-drafts/DRAFT_ID/publish \
  -H "Content-Type: application/json" \
  -d '{"publishKey":"YOUR_BLOG_PUBLISH_KEY"}'
```

The publish response contains the public `/blog/{slug}` URL. Repeating the publish call returns an already-published conflict instead of publishing twice.

## Validation and image behavior

- Draft payloads are Zod-validated and limited to 160 KB; article content is limited to 120,000 characters.
- Duplicate checks compare titles, slugs, anime names, article types and primary keywords across drafts and published posts.
- Internal links must resolve to existing published `/blog/{slug}` entries.
- Remote image URLs are limited to HTTP/HTTPS, protected against common private-network SSRF targets, capped at 10 MB and timed out after 12 seconds.
- Images are validated with Sharp, resized, converted to WebP and uploaded to Sanity. Sanity's existing image URL pipeline performs delivery-time resizing and format optimization.
- Image failures produce warnings and do not discard the draft.

## Verification commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
