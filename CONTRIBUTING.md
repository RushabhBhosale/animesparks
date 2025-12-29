# Contributing to AnimeSparks

Thank you for contributing to AnimeSparks.  
This project prioritizes clarity, performance, and SEO-safe implementation.

These guidelines apply to **humans and AI agents** working on the codebase.

---

## Project Purpose

AnimeSparks is an editorial anime blog focused on:

- Anime analysis
- Dark shonen and seinen storytelling
- Character studies and thematic breakdowns

The goal is to publish **fewer, higher-quality posts** with strong long-term value.

This is **not**:

- a news aggregation site
- a general pop-culture blog
- a tech or AI blog

---

## Tech Stack

Required stack:

- Next.js (App Router)
- React (Server Components preferred)
- Sanity CMS
- GROQ queries
- Tailwind CSS

Optional:

- shadcn/ui for UI primitives only

Avoid:

- Client-side rendering for blog content
- Heavy client state libraries
- Unnecessary abstractions

---

## Rendering Rules (Critical)

- Blog pages **must be server-rendered**
- Do not fetch blog data inside `useEffect`
- Use Server Components for content
- Metadata must be generated using `generateMetadata`

Breaking these rules can affect indexing.

---

## SEO Requirements

Every blog post must include:

- Unique page title
- Meta description (from Sanity excerpt)
- Canonical URL
- Article structured data (JSON-LD)
- Breadcrumb structured data (JSON-LD)

FAQ structured data:

- Add **only** if the post contains a real FAQ section

Do NOT:

- Add `noindex` or `nofollow`
- Duplicate canonical URLs
- Create thin or empty pages

---

## Content Guidelines

Allowed content:

- Anime analysis
- Arc and episode breakdowns
- Character psychology
- Genre evolution within anime

Avoid:

- Pure release news
- Clickbait titles
- One-paragraph opinion posts
- Non-anime topics

Rules:

- 1–2 categories per post maximum
- Tags are optional and supportive
- Categories define structure and internal linking

---

## UI & Design Guidelines

- Light theme
- Minimal copy (1–2 sentences per section)
- Blog content is the focus
- Clean, readable typography
- Avoid excessive animations or effects

Homepage priority:

- Latest blogs
- Clear navigation
- No marketing-heavy sections

---

## Adding New Features

When adding a feature:

1. Ensure it does not break server rendering
2. Confirm SEO metadata remains intact
3. Prefer simple, readable solutions
4. Avoid introducing client-only dependencies

Examples of acceptable features:

- Related posts
- Category pages
- Tag filtering
- RSS feed
- Sitemap generation

---

## Before Submitting Changes

- Run the app locally
- Visit at least one blog page
- Confirm content renders without client-side fetches
- Ensure no SEO-related files were altered unintentionally

---

## Guiding Principle

> Stability and clarity over cleverness.

AnimeSparks values **long-term quality and reliability** over rapid experimentation.
