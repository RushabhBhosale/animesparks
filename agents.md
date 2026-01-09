Codex Agent Instructions — AnimeSparks (Updated)
Project Identity

AnimeSparks is a serious anime editorial publication, not a generic blog.

It focuses on:

Long-form anime analysis

Psychological themes, lore, endings, character studies

Editorial depth over speed or volume

The UI is intentionally bold and distinctive, designed to feel like:

a dossier

a case file

a curated magazine

This visual identity is a core product feature, not decoration.

Non-Negotiable Foundations (Still Apply)

These rules do not change.

Tech Stack

Next.js App Router only

Server Components by default

Sanity CMS + GROQ

Tailwind CSS

shadcn/ui only when unavoidable

Rendering & Data

All blog content is server-rendered

No useEffect for blog fetching

No client-only blog pages

Metadata via generateMetadata

SEO & Indexing

Every blog page must include:

Unique <title>

Meta description (Sanity excerpt)

Canonical URL

Article JSON-LD

Breadcrumb JSON-LD

FAQ JSON-LD only if FAQs exist

Do NOT:

Use noindex

Duplicate canonicals

Create thin or placeholder pages

SEO stability > visual experimentation.

UI Philosophy (Updated)

AnimeSparks does not use a minimal blog UI anymore.

Instead:

Editorial, magazine-style layouts are the default

Strong typography, panels, and hierarchy are intentional

UI must feel curated, not templated

However:

Readability always wins

Visual intensity must never obscure content

Text must remain scannable and semantic

Structure stays consistent. Intensity can vary per page, but never breaks clarity.

Content Layout Rules
Blog Pages (Default Layout)

All blog pages use the same editorial dossier structure:

Full-bleed hero with title

Category + tag indicators

Author sidebar

Structured content panels

Clear section hierarchy

Optional community/comments section

Rules:

Content column must remain readable (optimal line length)

Headings must use proper HTML semantics (h1 → h2 → h3)

First meaningful paragraph must appear early (SEO + UX)

No decorative UI should delay content discovery.

Homepage & Index Pages (Updated)

Homepage, category pages, and tag pages:

Are editorial dashboards, not feeds

Feature curated sections (Featured, Trending, Deep Dive)

Minimal copy per section (1–2 lines max)

No marketing language

No filler content

Homepage is a magazine cover, not a landing page.

Categories & Taxonomy

Categories are editorial sections, not filters.

Rules:

1–2 categories per post max

Categories drive navigation and internal linking

Category pages may include:

short editorial descriptions

manifesto-style copy

curated featured content

Tags:

Support discovery

Never replace categories

Not primary navigation

Design Discipline Rules

To protect long-term usability:

Avoid visual noise stacking

Avoid animation that distracts from reading

Avoid novelty UI that does not serve content

Allow “quiet zones” in long articles

Do not sacrifice performance for aesthetics

Bold does not mean chaotic.

What Codex Must Avoid (Expanded)

Do NOT:

Revert to generic blog layouts

Introduce client-side rendering for content

Add pop-culture or non-anime topics

Over-animate or gamify reading

Add UI that hides or fragments content

Treat AnimeSparks like a startup landing page

Allowed Enhancements (Updated)

Codex MAY add:

Editorial layout variants (same structure, different intensity)

Internal linking blocks (“Related Files”, “Next Case”)

Reading time indicators

Category manifests or intro sections

Performance optimizations

Structured content enhancements (quotes, callouts, panels)

Only if they:

preserve SEO

improve clarity

respect the editorial tone

Final Objective

Build AnimeSparks as:

A fast, server-rendered anime publication

Visually distinctive and immediately recognizable

SEO-safe and scalable

Serious, editorial, and authoritative

This is not a blog theme.
It is a publishing system.
