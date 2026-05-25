# Kosh

> Sanskrit *कोश* — sheath, layer, treasury.
> A project management tool where work lives in layers.

## What this repo is

A **visual concept** (v1) for Kosh — a Jira-meets-Miro tool where every project is a canvas of tickets, sub-projects open into their own nested canvases, and the org chart is baked into who-sees-what.

This is **not the product yet**. It's a static HTML mockup we're using to finalize how the visualization should look before we build anything for real.

## How to view it

**Option 1 — Live (GitHub Pages):** open the Pages URL on the right side of this repo (set up under *Settings → Pages*).

**Option 2 — Locally:** clone the repo and double-click `index.html`. No build, no dependencies.

```bash
git clone https://github.com/NishadKook/kosh.git
cd kosh
open index.html
```

## What you can try in the mockup

- **Drill into a sub-project** — click *"Drill into sub-canvas →"* on the violet "Backend — Data Ingestion Pipeline" card. The whole canvas swaps, breadcrumb extends, inspector updates.
- **Come back** — click any earlier crumb in the breadcrumb trail.
- **Select a card** — clicking any ticket highlights it with a violet glow.

## What's on screen

- **Canvas** — three ticket types (work, sub-project, consolidation) connected by glowing bezier lines.
- **Project pulse strip** — overall progression, status counts, time-to-target.
- **Top bar** — breadcrumbs, search, *+ New ticket* (open to all project members), team avatars.
- **Inspector (right)** — selected ticket detail + a Context Pyramid block showing the org context that v2's AI will feed on.
- **AI dock (top right of canvas)** — placeholder for the scoped AI co-pilot landing in v2.

## Status

`v1` · visual concept · no backend · no real interactions beyond drill-down and select.

Working to finalize layout, ticket-card density, and visibility model before we start building.
