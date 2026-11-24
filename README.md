# style

The shared project page kit for every page under `projects.thedylone.com/<repo>/`.
GitHub Pages serves this repo at **https://projects.thedylone.com/style/**, so all project pages
load the same files and a change here reaches every page. The CSS and JS are served as they are; the header and footer are written into each page when it builds (see below).

| File | URL |
| --- | --- |
| Stylesheet | `https://projects.thedylone.com/style/v1/project-kit.css` |
| Section bar script | `https://projects.thedylone.com/style/v1/project-kit.js` |
| Page skeleton | [`v1/template.html`](v1/template.html) |
| Header and footer | [`v1/partials/`](v1/partials) (written into pages at build time) |

## Use it in a project

Link to the hosted files. Don't copy them into the project:

```html
<link rel="stylesheet" href="https://projects.thedylone.com/style/v1/project-kit.css" />
<!-- page-specific styles, if any, AFTER the kit -->
<script src="https://projects.thedylone.com/style/v1/project-kit.js" defer></script>
```

Use full URLs, not `/style/...`, so the files also load on a local dev server.
In a Vite project, put these tags in `index.html` and don't `import` the CSS, or Vite will bundle a copy.

### Moving a project off a copied kit

1. Delete the project's copies of `project-kit.css` and `project-kit.js`.
2. Replace the `./project-kit.css` and `./project-kit.js` references with the URLs above.
3. Check that the page looks the same. The hosted kit is v1.2, so first diff the old copy against it if the project has an older copy.

## Build and deploy

Every project page deploys through one shared workflow, [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
It checks out the project, runs its build if it has one, replaces the `.pk-header` and `.pk-footer` in every
HTML page with [`v1/partials/header.html`](v1/partials/header.html) and [`footer.html`](v1/partials/footer.html),
and deploys to GitHub Pages. The deployed pages carry the current header and footer as plain markup, with no JS.

A project's own `.github/workflows/pages.yml` is just the call:

```yaml
name: Deploy project page
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  pages:
    uses: thedylone/style/.github/workflows/pages.yml@main
    with:
      site: docs                      # folder to deploy (web/dist, . for the repo root, …)
      # ref: project-page             # if the page lives on another branch
      # build: npm ci && npm run build
      # working-directory: web
```

The repo's **Settings → Pages → Source** must be **GitHub Actions**.
Keep the copied header and footer in the project's HTML (or put `<!-- pk:header -->` and `<!-- pk:footer -->`
where they go) so the page still looks right on a local server; the build overwrites them either way.
To try the injection locally: `node scripts/inject-kit.mjs <built-site-dir> --repo thedylone/<repo>`.

### Rebuilding every page

Pushing a change to the partials, the script or the shared workflow runs
[`rebuild-projects.yml`](.github/workflows/rebuild-projects.yml), which starts `pages.yml` in each project repo.
You can also run it by hand from the Actions tab. Add new project repos to its list.

It needs a repository secret named `PROJECTS_TOKEN`: a fine-grained personal access token with
access to the project repos and the single permission **Actions: Read and write**.

## Versioning

- The path holds the **major** version (`v1/`). Fixes and additions that keep existing pages working
  go straight into `v1/` and reach every page. Bump the minor number in the file header (v1.2 → v1.3).
- A **breaking** change (renamed tokens or classes, changed markup) goes into a new `v2/` folder.
  Leave `v1/` in place and move projects over one at a time.
- GitHub Pages caches files for about 10 minutes, so allow that long for a change to show up.

## Rules

**Structure (identical on every page)**
- The header uses the exact `.pk-header` markup: brand "Dylan Chua" → https://thedylone.com,
  with nav links "Projects" and "Source" only. The build writes it in from `v1/partials/header.html`. Header height is fixed by the kit (3.5rem); don't add rows.
- The footer uses the exact `.pk-footer` markup: "© {YEAR} Dylan Chua" plus "All projects", "Portfolio", "GitHub".
- Section links never go in the header. Use the optional section bar (`.pk-subnav`) instead:
  - only on pages with **4 or more** sections, with **at most 7** links (pick the main ones);
  - placed directly after the hero, inside `<main>`, using the exact template markup;
  - link labels are the section eyebrows without their numbers ("Overview", "Method", "Results");
    every link targets a `.pk-section` id;
  - load `project-kit.js` with `defer`; don't write your own scroll-spy.
- The hero is always eyebrow → `h1.pk-title` → `.pk-lede` → `.pk-actions` (primary + "View code →") → `.pk-tags`.

**Casing**
- Eyebrows and nav: write in normal case; the CSS uppercases them. Don't type ALL CAPS in the HTML.
- Hero eyebrow: `Project · {Category}`, with a middle dot. Categories: Research, Visualisation, Simulation, Tools, Games.
- `h1`: the project's display name in Title Case (e.g. "Bare-Metal Llama 3"), unless the name is
  intentionally lowercase (e.g. "gorillatype").
- `h2` and `h3`: sentence case ("How the kernels work"), no trailing period.
- Section eyebrows are numbered: `01 — Overview`, `02 — Method`, … (an em dash with spaces).
- Buttons: sentence case, with an arrow: "Try the demo ↓", "View code →", "Read the paper ↗".
- Tags: the technology's own casing (CUDA, PyTorch, three.js, KaTeX).

**Type and colour**
- Use only the kit's classes and tokens. No other fonts, sizes for h1/h2, or colours.
- Charts use `--series-1` … `--series-5` in order, IBM Plex Mono for axis labels and `--color-hairline` for gridlines,
  on a white or transparent background.
- Equations go in `.pk-math`, using KaTeX.

**Layout**
- Content width comes from `.pk-container`; long text goes in `.pk-prose` (70ch).
- Sections are separated by `.pk-section` spacing only; no extra dividers or backgrounds.
- No background animations or particle effects; the gallery is the only page with one.
- Responsive down to 390px with no horizontal page scroll.
