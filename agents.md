# Codex Agent Instructions — AnimeSparks

## Project Overview

AnimeSparks is a modern anime editorial blog built with:

- Next.js (App Router)
- Sanity CMS
- Tailwind CSS
- Light, minimal UI
- SEO-first architecture

Primary focus:

- Anime blogs and analysis
- Dark shonen, character studies, storytelling
- No general pop culture or tech content

---

## Core Principles

- SEO-safe, server-rendered pages only
- Minimal UI text, focus on blog content
- Clean, readable layouts
- Editorial tone, not fan-blog tone
- No unnecessary abstractions

---

## Tech Stack Rules

- Use **Next.js App Router**
- Prefer **Server Components**
- Use **Sanity + GROQ** for content
- Tailwind CSS for styling
- shadcn/ui only when necessary
- No heavy client-side state for blogs

---

## Rendering Rules

- Blog content must be rendered on the server
- No `useEffect` for fetching blog data
- No client-only blog pages
- Metadata must be generated using `generateMetadata`

---

## SEO Requirements

Every blog page must include:

- Unique `<title>`
- Meta description (from Sanity excerpt)
- Canonical URL
- Article JSON-LD
- Breadcrumb JSON-LD
- FAQ JSON-LD (only if FAQs exist)

Do NOT:

- Add `noindex`
- Duplicate canonicals
- Create thin pages

---

## Content Structure

Sanity schemas include:

- Post
- Category
- Author
- Tags (string array)
- Optional FAQ field

Rules:

- 1–2 categories per post max
- Tags are supportive, not primary navigation
- Categories drive structure and internal linking

---

## Homepage Guidelines

- Light theme
- Minimal copy (1–2 sentences max per section)
- Blog cards are the primary focus
- No hero paragraphs
- No marketing fluff

---

## Coding Style

- Prefer clarity over cleverness
- Avoid comments unless absolutely necessary
- Use semantic HTML
- Keep components small and readable
- No unnecessary re-renders

---

## What Codex Should Avoid

- Adding unrelated features
- Overengineering UI
- Mixing non-anime topics
- Adding client-side data fetching for blogs
- Introducing SEO-breaking changes

---

## Allowed Enhancements

- Internal linking components
- Related posts logic
- Category and tag pages
- RSS feed
- Sitemap generation
- Performance optimizations

---

## Goal

Build a fast, clean, authoritative anime blog that:

- Indexes reliably
- Feels editorial
- Scales without SEO regressions

Codex should prioritize **stability, clarity, and SEO safety** over experimentation.
