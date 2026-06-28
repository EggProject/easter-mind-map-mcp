# Templates — full documentation for every asset

This file is the long-form documentation for every template in
`assets/templates/`. Each entry has four parts:

1. **What this template is for** — one sentence.
2. **The eight canonical sections** in the order they appear, with a
   one-line description of what each section is supposed to answer.
3. **What makes this template different from a generic one** — the
   "X-specific" content (e.g. a CLI template has a "Commands" table
   that a library template doesn't).
4. **Common mistakes** when filling in this template.

You only need to read the entry for the template you picked in
phase 3. Use the table of contents below to jump.

## Table of contents

- [`library.md`](#library) — reusable code library
- [`cli-tool.md`](#cli-tool) — command-line executable
- [`web-app.md`](#web-app) — browser-based frontend
- [`api-service.md`](#api-service) — HTTP / REST / GraphQL backend
- [`desktop-app.md`](#desktop-app) — Electron / Tauri / native
- [`mobile-app.md`](#mobile-app) — iOS / Android / RN / Flutter
- [`monorepo.md`](#monorepo) — multiple packages in one repo
- [`data-science.md`](#data-science) — Jupyter + Python + datasets
- [`github-action.md`](#github-action) — reusable GitHub Action
- [`vscode-extension.md`](#vscode-extension) — VS Code extension

---

<a id="library"></a>
## `library.md`

**For**: a reusable code library published to a package registry
(npm, PyPI, crates.io, pkg.go.dev, RubyGems, Maven Central, NuGet).

**The eight sections**, in order:

1. **Title + one-line tagline** — `<name>: <one-line description>`.
2. **Badges** — license, npm/PyPI/crates version, build status, language.
3. **Description** (≤ 4 lines) — what the library is, who it's for.
4. **Installation** — the *single command* the user needs. For
   multi-language libraries, lead with the most common one and
   group the others under a "Other languages" sub-bullet.
5. **Usage** — *one* minimal code example, copy-paste-runnable.
   Show the import + one or two function calls. Don't dump the full
   API here — that goes in `docs/api.md`.
6. **API reference (link only)** — `See [the API docs](docs/api.md)
   for the full reference.`
7. **Contributing** — link to `CONTRIBUTING.md` or one short
   paragraph ("PRs welcome, run `npm test` first").
8. **License** — SPDX id + link to `LICENSE`.

**What makes this template different**: the "Installation" section
is the *single most important* part. A library that can't be
installed in one line is a library that doesn't get installed.
The "Usage" section should be **one**, not five, code examples —
pointers to more go in the API docs.

**Common mistakes**:

- Dumping the full API in the README. The README is the landing
  page, not the manual.
- Listing 5 install commands. Pick the primary one.
- Showing a "Hello World" that's actually 30 lines. Cut it to
  5–10 lines.
- Forgetting to link to a CHANGELOG / migration guide if the
  library is at v2+.

---

<a id="cli-tool"></a>
## `cli-tool.md`

**For**: a command-line executable installed via `npm install -g`,
`brew install`, `pipx install`, `cargo install`, etc.

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the CLI does in one line>`.
2. **Badges** — license, version, language, build status.
3. **Description** — what problem the CLI solves.
4. **Demo** — a terminal recording (asciinema / SVG) showing
   the CLI in action. A code block of sample output is the
   second-best alternative. For how to render a terminal-window
   image or animation (and the tool install policy), see
   `references/terminal-blocks.md`.
5. **Installation** — the *one* install command. Examples:
   - `brew install <name>`
   - `npm install -g <name>`
   - `cargo install <name>`
   - `pipx install <name>`
6. **Usage** — the **command table**. Format:
   ```markdown
   | Command | Description |
   |---|---|
   | `<name> init` | Initialize a new project in the current directory. |
   | `<name> build` | Build the project for production. |
   | `<name> deploy` | Deploy the project to the configured target. |
   ```
   Always show 3–7 commands. If the CLI has 20+ commands, link to
   `docs/commands.md` for the full list.
7. **Configuration** — env vars, config file location, defaults.
   Often a short table.
8. **Contributing + License** — same as the library template.

**What makes this template different**: the **command table** is
the centerpiece. A reader should be able to scroll to the Usage
section and see, in 10 seconds, what the CLI can do. The Demo
section is also unique to CLIs (libraries don't have demos).

**Common mistakes**:

- Dumping `--help` output as the "Usage" section. That's not a
  README, that's a man page. The command table is the *human*
  description; `--help` is the machine description.
- Skipping the Demo section. A 30-second asciinema is worth
  500 words.
- Forgetting to mention config files / env vars.

---

<a id="web-app"></a>
## `web-app.md`

**For**: a browser-based frontend — React/Vue/Svelte/Angular/SolidJS
SPA, a Next.js/Nuxt/SvelteKit/Astro app, or a static site.

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the web app does>`.
2. **Badges** — license, version, language, build status, deploy
   status (Vercel/Netlify/Cloudflare).
3. **Hero image / screenshot** — the most important visual asset
   in the entire README. Should be 600–1200 px wide, captioned
   with one line: "The dashboard view of `<name>`."
4. **Description** — one paragraph, ≤ 4 lines.
5. **Live demo** — a prominent `🚀 **[Try it on vercel.com](url)**`
   link if there's a public deployment (icon outside the bold link —
   see hard rule #11).
6. **Tech stack** — bullet list: framework, styling, state
   management, testing, deployment.
7. **Local development** — `npm install && npm run dev` (or
   equivalent) + the URL it serves on. Mention any required
   env vars.
8. **Deployment + Contributing + License** — short stubs, each
   linking to a `docs/*.md` for the long version.

**What makes this template different**: the **screenshot is
non-negotiable**. A web app README without a screenshot is a
code review, not a landing page. Also unique: the "Live demo"
link and the "Tech stack" list, both of which are specific to
deployed web apps.

**Common mistakes**:

- Skipping the screenshot. Always include one.
- Listing 12 dependencies in the Tech stack. Keep it to 5–8.
- Forgetting to mention required env vars (the #1 reason a
  reader can't get a web app running locally).
- The "Local development" section should fit in 3 lines, not
  30. The long version goes in `docs/local-development.md`.

---

<a id="api-service"></a>
## `api-service.md`

**For**: an HTTP / REST / GraphQL / gRPC backend service that runs
as a server (Node/Go/Python/Rust/Java).

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what API protocol, what domain>`.
2. **Badges** — license, version, build status, container registry.
3. **Description** — what the API does, who calls it, what
   protocol (REST/GraphQL/gRPC).
4. **Endpoints** — a **table** of the top 5–10 endpoints:
   ```markdown
   | Method | Path | Description |
   |---|---|---|
   | `GET`  | `/api/v1/users` | List users. |
   | `POST` | `/api/v1/users` | Create a user. |
   | `GET`  | `/api/v1/users/{id}` | Get a user by ID. |
   ```
   The table is the API's elevator pitch.
5. **Authentication** — how clients authenticate (API key, OAuth2,
   JWT, mTLS). If the API is public, link to a "Get a free API key"
   page.
6. **Local development** — `docker compose up` (or equivalent) +
   the URL it serves on.
7. **Deployment + Contributing + License** — stubs.

**What makes this template different**: the **endpoints table**
is the centerpiece. Readers evaluating an API want to know in 5
seconds: what protocol, what auth, what endpoints, what rate
limits. The "Authentication" section is also unique — APIs have
it, libraries usually don't.

**Common mistakes**:

- Listing every endpoint in the README. Show 5–10 top-level
  endpoints; link to `docs/api.md` (or the OpenAPI / GraphQL
  schema) for the full reference.
- Skipping the auth section. An API without a documented auth
  model is an API no one can call.
- Forgetting rate limits / quotas. Mention them.

---

<a id="desktop-app"></a>
## `desktop-app.md`

**For**: an Electron / Tauri / native macOS / native Windows / native
Linux app.

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the desktop app does>`.
2. **Badges** — license, version, language, build status, release.
3. **Screenshots** — 2–4 screenshots in a grid, each captioned.
4. **Description** — one paragraph.
5. **Installation** — the platform-specific installers:
   ```markdown
   - macOS: download `<name>-x.x.x.dmg` from [Releases](...)
   - Windows: download `<name>-x.x.x.exe` from [Releases](...)
   - Linux: download `<name>-x.x.x.AppImage` from [Releases](...)
   ```
   If the app is on a package manager (`brew install`, `snap install`,
   `choco install`), link that too.
6. **Usage** — quick start, keyboard shortcuts table.
7. **Build from source** — `git clone`, `npm install`, `npm run build`,
   `npm run dist`. The exact commands.
8. **Contributing + License**.

**What makes this template different**: the **multi-platform
install section** is unique. A desktop app lives on three
platforms at minimum; the README must show how to install on
each. The "Build from source" section is also non-negotiable —
desktop apps are often built from source by tinkerers.

**Common mistakes**:

- One screenshot. Show 2–4 — main view, settings, a workflow.
- Forgetting one of the three platforms in the install list.
- Skipping the "Build from source" section. Many desktop-app
  users *want* to build from source.

---

<a id="mobile-app"></a>
## `mobile-app.md`

**For**: an iOS / Android / React Native / Flutter / Kotlin
Multiplatform mobile app.

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the mobile app does>`.
2. **Badges** — license, version, language, build status, app
   store badges (App Store / Google Play).
3. **App store badges** — the two big badges near the top, linking
   to the App Store / Play Store.
4. **Screenshots** — 3–6 phone mockups in a row, captioned.
5. **Description** — one paragraph, ≤ 4 lines.
6. **Build from source** — the exact commands for the platform
   (e.g. `xcodebuild`, `gradlew assembleDebug`, `flutter build`).
7. **Architecture** — one paragraph + a tech stack list. For
   RN/Flutter, mention the bridge / FFI / state management.
8. **Contributing + License**.

**What makes this template different**: the **app store badges**
are unique to mobile apps — they're the equivalent of a "Live
demo" link for web apps. The build-from-source section is also
platform-specific.

**Common mistakes**:

- Skipping the app store badges. They're the first thing a mobile
  user looks for.
- Screenshots without phone mockups. Raw screenshots look like
  debugging output; framed screenshots look like a real product.
- Build commands that don't actually work. Test them.

---

<a id="monorepo"></a>
## `monorepo.md`

**For**: a single repo with multiple packages
(`pnpm-workspace.yaml`, `lerna.json`, NX, Turborepo, Bazel).

**The eight sections**, in order:

1. **Title + tagline** — `<monorepo-name>: <one-line about the
   collection of packages>`.
2. **Badges** — license, monorepo-level version, build status.
3. **Packages** — a **table** of the packages:
   ```markdown
   | Package | Description | Version |
   |---|---|---|
   | [`@scope/core`](packages/core) | Core library. | ![npm](https://img.shields.io/npm/v/@scope/core) |
   | [`@scope/cli`](packages/cli) | Command-line interface. | ![npm](https://img.shields.io/npm/v/@scope/cli) |
   | [`@scope/web`](packages/web) | Web UI. | ![npm](https://img.shields.io/npm/v/@scope/web) |
   ```
   The table is the README's centerpiece. Each row is a deep
   link to the package's own README.
4. **Quick start** — clone, install, build, test (all of them,
   because monorepos have monorepo-level commands).
5. **Per-package READMEs** — note that each package has its own
   README with details.
6. **Contributing guide** — link to `CONTRIBUTING.md` with notes
   on the monorepo workflow (e.g. "use `pnpm --filter` to work
   on a single package").
7. **Architecture** — one paragraph + an ASCII diagram of how
   the packages relate.
8. **License**.

**What makes this template different**: the **packages table**
is unique to monorepos. It's the README's index — a reader
should be able to see all packages in one screen and click
into the one they care about. The "Architecture" section is
also more important for a monorepo than for a single package.

**Common mistakes**:

- Treating the monorepo README as a per-package README. The
  monorepo README is the *index*; the per-package READMEs are
  the deep dives.
- Forgetting to mention the monorepo tool (pnpm / lerna / NX /
  Turborepo) in the Quick Start.
- Skipping the architecture diagram. A monorepo without a "how
  the packages fit together" diagram is a monorepo no one
  understands.

---

<a id="data-science"></a>
## `data-science.md`

**For**: a Jupyter-notebook-heavy project — a research codebase, an
ML model, a dataset analysis, a reproducible experiment.

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the research / model does>`.
2. **Badges** — license, DOI (if there's a paper), build status.
3. **Description** — the research question, the model / method,
   the result.
4. **Demo / results** — a chart, a confusion matrix, a
   comparison table, or a link to a hosted notebook (e.g.
   `nbviewer.jupyter.org`).
5. **Datasets** — where the data comes from, how to download
   it, license of the data, citation.
6. **Reproducing the results** — the *exact* commands:
   ```bash
   git clone <repo>
   cd <repo>
   pip install -r requirements.txt
   jupyter notebook notebooks/main.ipynb
   ```
   Plus the expected runtime and hardware (e.g. "trained on
   1× A100 for 6 hours").
7. **Citation** — BibTeX entry, paper link.
8. **License**.

**What makes this template different**: the **Datasets** and
**Citation** sections are unique to data-science projects. The
"Reproducing the results" section is also more detailed than for
a normal library — researchers want to know *exactly* what you
ran and what they should expect.

**Common mistakes**:

- Vague install instructions. "Install Python and the
  requirements" isn't enough — give the exact `pip install -r`
  command.
- Skipping the citation. If you have a paper, the BibTeX entry
  is non-negotiable.
- Forgetting to mention hardware. "Trained on 1× A100 for 6
  hours" matters more than "trained on a GPU".

---

<a id="github-action"></a>
## `github-action.md`

**For**: a reusable GitHub Action (composite / JavaScript / Docker /
Python).

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the action does in one line>`.
2. **Badges** — license, version (`git tag`), marketplace badge.
3. **Description** — what the action does, what problem it solves.
4. **Usage** — the *minimum* `uses:` snippet:
   ```yaml
   - uses: <owner>/<name>@v1
     with:
       input1: 'value'
   ```
   Plus a "Full example" linking to a workflow file.
5. **Inputs** — a **table**:
   ```markdown
   | Input | Required | Default | Description |
   |---|---|---|---|
   | `input1` | Yes | — | Description of input1. |
   | `input2` | No | `'default'` | Description of input2. |
   ```
6. **Outputs** — a similar table for outputs.
7. **Building from source** — `npm run build && npm run package`.
8. **Contributing + License**.

**What makes this template different**: the **Inputs / Outputs
tables** are unique to GitHub Actions — they're the API. A reader
should be able to copy-paste the Usage snippet into a workflow
file and have it work.

**Common mistakes**:

- Forgetting the marketplace badge. It's the equivalent of an
  app store badge.
- Vague input descriptions. "The path" isn't enough — "The
  path to the configuration file (default: `./config.yml`)."

---

<a id="vscode-extension"></a>
## `vscode-extension.md`

**For**: a Visual Studio Code extension (published to the
marketplace).

**The eight sections**, in order:

1. **Title + tagline** — `<name>: <what the extension does>`.
2. **Badges** — license, version, marketplace version, install
   count, rating.
3. **Screenshot / animated GIF** — a 600–800 px wide screenshot
   *or* a short animated GIF (GIFs sell VS Code extensions
   better than static screenshots).
4. **Description** — one paragraph.
5. **Installation** — the **marketplace badge** linking to
   `vscode:extension/<publisher>.<name>`, plus the
   command-line install:
   ```bash
   code --install-extension <publisher>.<name>
   ```
6. **Configuration** — the `settings.json` snippet the user
   needs:
   ```json
   {
     "<name>.enable": true,
     "<name>.maxLineLength": 100
   }
   ```
7. **Commands** — a table of contributed commands (e.g.
   `extension.doSomething`).
8. **Contributing + License**.

**What makes this template different**: the **marketplace badge**
is the install link — the equivalent of the app store badge for
mobile apps. The animated GIF is also more important here than
for most project types because VS Code extensions are visual by
nature.

**Common mistakes**:

- Static screenshot only. Animated GIFs convert 2–3× better.
- Forgetting the `code --install-extension` command. Some users
  prefer it.
- Skipping the contributed-commands table. It's the API for
  keyboard-shortcut-driven users.

---

## Picking a template vs the no-template path

If your project doesn't match one of the 10 templates above, you
have two options:

1. **Pick the closest template and adapt it.** A Chrome extension
   is close to a `web-app` template. A Terraform module is close
   to a `library` template (you "import" it). A WordPress plugin
   is close to a `library` template with a "WordPress-specific
   Install" twist.

2. **Use the no-template path.** This is the right choice when
   the project type is genuinely unusual (Kubernetes operator,
   firmware, OS kernel module, Unreal plugin, etc.) or when the
   user explicitly says "I want a custom README, don't use a
   template". See `references/no-template-guide.md`.
