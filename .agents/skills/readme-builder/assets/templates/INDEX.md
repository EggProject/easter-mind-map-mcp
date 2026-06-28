# Template index

Pick exactly one. If none match, use the no-template path
(`references/no-template-guide.md`).

| File | Hungarian mirror | When to pick |
|---|---|---|
| `library.md` | `library.hu.md` | Reusable code library published to a package registry (npm, PyPI, crates.io, pkg.go.dev, etc.). |
| `cli-tool.md` | `cli-tool.hu.md` | A command-line executable installed via `npm install -g`, `brew install`, `pipx install`, `cargo install`, etc. |
| `web-app.md` | `web-app.hu.md` | A browser-based frontend (React/Vue/Svelte/SPA, Next.js/Nuxt/SvelteKit/Astro, static site). |
| `api-service.md` | `api-service.hu.md` | An HTTP / REST / GraphQL / gRPC backend that runs as a server. |
| `desktop-app.md` | `desktop-app.hu.md` | An Electron / Tauri / native macOS / native Windows / native Linux app. |
| `mobile-app.md` | `mobile-app.hu.md` | An iOS / Android / React Native / Flutter app. |
| `monorepo.md` | `monorepo.hu.md` | A single repo with multiple packages (pnpm workspaces, lerna, NX, Turborepo, Bazel). |
| `data-science.md` | `data-science.hu.md` | A Jupyter-heavy research codebase, ML model, dataset analysis, reproducible experiment. |
| `github-action.md` | `github-action.hu.md` | A reusable GitHub Action (composite / JavaScript / Docker / Python). |
| `vscode-extension.md` | `vscode-extension.hu.md` | A Visual Studio Code extension published to the marketplace. |

**Workflow:** phase 4 opens the English template (e.g.
`library.md`) and fills it in. Phase 5 opens the matching
`*hu.md` template (e.g. `library.hu.md`) and mirrors the content —
same section headers (in Hungarian), same code blocks (untranslated),
same badge block (only the language badge swaps).

For each template, the long-form documentation is in
`references/templates.md` — read the entry for the template you
picked, *then* open the template file.
