---
name: readme-builder
description: |
  Create README files.
license: MIT
---

# readme-builder

> Build a complete, polished, bilingual (English + Hungarian) README for
> any project — and the matching LICENSE — in a single guided flow.

## What this skill does

`readme-builder` turns the messy first hour of "I just pushed to GitHub
and the README is empty" into a 5-minute guided flow that ends with:

1. A real `LICENSE` file (downloaded from GitHub's official license
   picker, SPDX-compliant, plain text) for the license the user picks.
2. An English `README.md` that follows the convention for the detected
   project type (library, CLI, web app, API, etc.).
3. A Hungarian `README.hu.md` that mirrors the English one (same section
   order, same badges, same anchors, same information — only the prose
   is translated).
4. A badge block in each README that links the two language versions to
   each other, so a reader landing on either one can switch.

The output is intentionally consistent: every README this skill produces
has the same anchor names (`#-installation`, `#-usage`, `#-license`,
etc.), the same `## 📖 Documentation` table when a `docs/` folder
exists, and the same closing `#-contributing` / `#-license` block —
so when a user runs the skill on ten different projects, all ten
READMEs *feel* like they came from the same hand.

## When to use this skill

Trigger this skill whenever the user mentions **any** of:

- "write me a README", "create a README", "set up a README"
- "I need a project page for my repo", "my repo has no README"
- "audit my README", "improve my README", "rewrite my README"
- "add a LICENSE file", "I forgot to add a license"
- "make my repo look professional on GitHub"
- A specific project-type noun + "README" (e.g. "CLI README",
  "library README", "API README")
- Bilingual / multilingual repo setup (English + any second language,
  but the bundled second language is Hungarian)

When the user's intent is **only** about non-README docs (CHANGELOG,
CONTRIBUTING, CODE_OF_CONDUCT), do **not** use this skill — those have
their own conventions. When the user wants an internal wiki page or a
blog post, do **not** use this skill — use the MediaWiki / blog skills
instead.

## Workflow (read this end-to-end before doing anything)

The skill has **six mandatory phases**. The order is not a suggestion;
the phases build on each other (you can't pick the right template in
phase 3 if you haven't asked the right questions in phase 1, and you
can't write the Hungarian version in phase 6 if you haven't written
the English one in phase 5).

> **🛑 Hard rule — TodoCreate is MANDATORY.**
> At the very start of phase 1, call `TaskCreate` to create one task
> per phase (six tasks). Set the first one to `in_progress` before you
> begin it. Update the status as you go. If the user later asks for
> more work (audit, regenerate, add docs), append new tasks — never
> silently drop the existing six.
> Why: a todo list is the only way the user can see at a glance which
> phase you're stuck in if you crash or need a hand-off. Skipping it
> is the #1 reason README-building sessions go off the rails.

### Phase 1 — Detect the project and gather facts

Before you write a single line of prose, you need five things:

1. **Project type** — auto-detect from filesystem, then confirm with
   the user. Detection rules:
   - `package.json` with `"bin"` field → CLI tool
   - `package.json` with `"main"`/`"exports"` and no `"bin"` → library
   - `pyproject.toml` / `setup.py` → Python (then look at entry points)
   - `Cargo.toml` with `[[bin]]` → Rust binary; without → Rust library
   - `go.mod` → Go module (CLI vs lib depends on `cmd/` folder)
   - `pom.xml` / `build.gradle` → JVM (look at the artifact type)
   - `Gemfile` → Ruby (look at `exe/` for CLI)
   - `index.html` + `package.json` scripts with a build step → web app
   - `Dockerfile` + an `EXPOSE` directive → service / API
   - `*.xcodeproj` / `*.gradle` (Android) → mobile / desktop
   - `.github/workflows/*.yml` + `action.yml` → GitHub Action
   - A monorepo marker (`pnpm-workspace.yaml`, `lerna.json`, NX config,
     multiple `package.json` files) → monorepo
2. **Project name, tagline, one-paragraph description** — if not in
   `package.json` / `pyproject.toml` / `Cargo.toml`, ask the user.
   *Never* invent a tagline; the skill's value is faithful output, and
   a fake tagline is the fastest way to lose trust.
3. **Install / run / test commands** — read them from the build files.
   If ambiguous, ask. Never guess.
4. **License preference** — handled in phase 2 (mandatory AskUserQuestion).
5. **Whether the project is brand-new or has existing docs** — if
   `README.md` already exists, ask whether the user wants a full
   rewrite, a section-by-section audit, or just to backfill missing
   sections. The default is **full rewrite** unless the file is < 30
   lines (in which case backfill).

**Output of phase 1**: a one-screen mental model:
> "Project X is a Y; install with Z; run with W; license will be picked
> in phase 2; existing README has N lines → strategy is full rewrite."

### Phase 2 — Pick the license (MANDATORY AskUserQuestion + GitHub download)

A README without a license is a README that scares off contributors.
Treat license selection as a hard gate: do not proceed to phase 3
until the user has picked one and the file exists on disk.

1. Call `AskUserQuestion` with these four options (single-select,
   the first one marked "Recommended" only if `MIT` is the project
   default — most projects in 2026 are MIT, but don't assume):

   | Label (≤12 chars) | Description |
   |---|---|
   | **MIT** (Recommended) | Permissive, short, what most JS/TS/Python/Go projects ship. |
   | **Apache-2.0** | Permissive + explicit patent grant; common in Java/Go/Swift. |
   | **GPL-3.0** | Strong copyleft; pick this only if the user mentions "copyleft" or "GPL". |
   | **BSD-3-Clause** | Permissive, similar to MIT, with a non-endorsement clause. |
   | **Other** | Show this as a free-text fallback — they can name MPL-2.0, Unlicense, AGPL-3.0, ISC, etc. (handled by hand). |

   The tool itself has an "Other" option built in, so you don't need to
   add it — the system provides it automatically. Just include 3–4 of
   the above and let the harness add the free-text escape hatch.

2. Once the user picks, run the bundled `scripts/download_license.py`
   (or the `.sh` variant if `python3` is unavailable). The script hits
   GitHub's official license API:

   ```
   https://api.github.com/licenses/{spdx-id}
   ```

   and writes the response's `body` field (the actual license text) to
   `LICENSE` in the project root. The script **also** writes a small
   `.license-meta.json` next to it containing the SPDX id, year, and
   copyright holder name it asked for — so you can reference these in
   the README's license badge without re-asking.

   If the network is unavailable, **stop and tell the user**. Do not
   write a hand-typed license — every popular open-source license has
   a specific canonical text, and paraphrasing is a real legal risk.

3. Confirm to the user: "Downloaded `LICENSE` (MIT, copyright
   `<name>`, year 2026) — want me to keep going?" Only on yes, move on.

### Phase 3 — Pick the template (or admit you need the no-template path)

Read `assets/templates/INDEX.md` (a tiny file we maintain — see
`references/templates.md` for the full map). Pick exactly one:

- `library.md` — reusable code library (Node, Python, Go, Rust, etc.)
- `cli-tool.md` — command-line executable
- `web-app.md` — browser-based frontend
- `api-service.md` — HTTP / REST / GraphQL backend
- `desktop-app.md` — Electron / Tauri / native desktop
- `mobile-app.md` — iOS / Android / React Native / Flutter
- `monorepo.md` — multiple packages in one repo
- `data-science.md` — Jupyter notebooks + Python + datasets
- `github-action.md` — reusable GitHub Action
- `vscode-extension.md` — VS Code extension

If the project doesn't match any of the above (e.g. a Chrome extension,
a Terraform module, a Kubernetes operator, an OS kernel module, an
embedded firmware project, an Unreal Engine plugin, a VS Code theme
that isn't an extension), **stop, do not pick a near-miss template**,
and switch to the **No-Template Authoring Path** described in
`references/no-template-guide.md`. The full guide is long; the gist is:

1. Enumerate the **eight canonical README sections** (Title, Badges,
   Description, Screenshots/Demo, Install, Usage, Contributing, License)
   — every good README has them, in some form.
2. Decide which are mandatory for this project type (a CLI tool
   almost never has Screenshots; a web app almost always does).
3. For each mandatory section, write a 1–3 sentence "what this section
   should answer" note (e.g. for "Install" — "the user should be able
   to copy-paste one command and have the project running locally").
4. Draft each section, then run the **README Sanity Checklist** at the
   bottom of the no-template guide (12 yes/no questions).

The no-template path is **not** a fallback for laziness. It's a
deliberate authoring exercise. A well-written bespoke README for a
Kubernetes operator is better than a library README with the words
"library" swapped out for "operator" — readers can tell.

### Phase 4 — Author the English `README.md`

Open the chosen template (or the no-template checklist output) and
fill it in. The template files are the **English** versions; for the
Hungarian mirror in phase 5, you'll open the matching `*.hu.md`
template (e.g. `assets/templates/library.hu.md` mirrors
`assets/templates/library.md`). Hard requirements:

- **Anchor consistency.** Section headers must use GitHub-flavored
  Markdown anchors. Stick to ASCII headers, no emoji at the start of
  the header line, no punctuation in headers. The skill's house
  convention: `## Installation`, `## Usage`, `## Contributing`,
  `## License` (capitalized nouns, no `🔧` prefix in the header itself —
  the emoji can be in a callout block *above* the header if you want
  visual flair).
- **Badges block at the top.** Always include: license badge (using
  the SPDX id from phase 2), language badge (English, linking to
  `README.md`), and a project-type badge. Optional but recommended:
  build status, version, downloads. Keep the badge block ≤ 6 badges
  to avoid visual clutter.
- **One install command that works.** If install is multi-step, give
  the *shortest* path first and link to a `docs/installation.md` for
  the long version. The first 20 lines of the README should answer
  "what is this?" and "how do I run it?" — anything else is below the
  fold.
- **One usage example that actually runs.** The reader should be able
  to copy-paste the code block and see the same output you claim. If
  the example requires a running server, say so explicitly.
- **No placeholder TODOs.** If a section is unknown (e.g. you couldn't
  find a CHANGELOG), **omit the section** — don't write "TODO: link
  to CHANGELOG here". A short, complete README beats a long, half-empty
  one.
- **Tone: declarative, present tense, second person.** "Run
  `npm install`" not "you can run `npm install`". "The CLI accepts
  three flags" not "the CLI is able to accept three flags".
- **Length budget.** Aim for 80–200 lines of prose + code. Beyond
  250, you should be splitting into `docs/` and linking.

### Phase 5 — Mirror to Hungarian `README.hu.md`

This is **not** a translation step in the linguistic sense — it's a
mirroring step. Open the matching `*.hu.md` template that ships
alongside the English one you used in phase 4
(`assets/templates/library.hu.md` for `library.md`,
`assets/templates/cli-tool.hu.md` for `cli-tool.md`, and so on).
The Hungarian template is the layout; you fill in the prose.

The two files must:

- Have the **same section headers** (in Hungarian). E.g. `## Telepítés`
  for Installation, `## Használat` for Usage, `## Közreműködés` for
  Contributing, `## Licenc` for License.
- Use the **same anchor IDs**. GitHub auto-generates anchors from
  header text, so the Hungarian anchors will differ from the English
  ones — that's fine, the two files don't need to share anchors
  because they aren't cross-linked by anchor.
- Have a **bilingual link at the top**:
  ```markdown
  🇬🇧 **[English version →](README.md)**
  ```
  in the Hungarian file, and the mirror in the English file:
  ```markdown
  🇭🇺 **[Magyar verzió →](README.hu.md)**
  ```
  Note the icon placement: the flag emoji sits **outside** the `**…**`
  and the `[…]` link — see hard rule #11 for why.
- Translate **prose only** — code blocks, badges, URLs, file paths,
  CLI flags, and SPDX license identifiers stay in their original form.
- Keep the **same badge block** but swap the language badge label
  (`[![English](...)](README.md)` becomes
  `[![Magyar](...)](README.hu.md)` in the Hungarian file).

The user can choose to opt out (some projects are English-only). If
they do, write a stub `README.hu.md` containing only:

```markdown
# <Project name> (magyar)

Ehhez a projekthez jelenleg csak angol nyelvű dokumentáció érhető el.
Lásd: [README.md](README.md).
```

…and note the opt-out in your summary.

### Phase 6 — Wrap-up: report + housekeeping

Tell the user, in one screen:

1. What you wrote (English README + Hungarian README + LICENSE +
   `.license-meta.json`).
2. Which template you used (or "custom no-template path" if so).
3. The exact badge URLs you generated (so they can sanity-check).
4. Anything you **didn't** fill in (and why) — be honest.
5. Suggested next steps: "Consider adding a CHANGELOG, CONTRIBUTING.md,
   and a `.github/ISSUE_TEMPLATE/`."

If you started a workspace directory for outputs, leave a copy of
both READMEs and the LICENSE there too, in case the user wants to
diff later. Mark all six tasks completed.

## Bundled resources

| Path | What's in it | When to read |
|---|---|---|
| `assets/templates/` | 10 ready-to-fill README templates, one per project type | Phase 3 |
| `assets/templates/INDEX.md` | one-line summary of each template | Phase 3 (always) |
| `references/templates.md` | long-form docs for every template — what each section is for and what to put in it | Phase 4 (when you need guidance on a specific template) |
| `references/no-template-guide.md` | the 8 canonical sections, the "what should this section answer" prompts, the 12-question sanity checklist | Phase 3 (only if no template matches) |
| `references/terminal-blocks.md` | how to render a code block / CLI session as a macOS terminal-window image (static via `freeze`/`silicon`, animated via `vhs`/`asciinema`) — incl. the `tmp/` install policy | Phase 4 (only when a CLI/visual project wants a terminal demo) |
| `references/license-types.md` | full list of SPDX licenses the download script supports, plus the URL pattern for unsupported ones | Phase 2 |
| `references/style-guide.md` | tone, formatting, anchor, badge, length rules — the *why* behind phase 4's hard requirements | Phase 4 (read once, internalize) |
| `scripts/download_license.py` | hits `https://api.github.com/licenses/{spdx-id}` and writes `LICENSE` | Phase 2 |
| `scripts/download_license.sh` | bash fallback when `python3` isn't available | Phase 2 (fallback) |
| `evals/evals.json` | 4 realistic test prompts you can use to verify the skill | After authoring — sanity check |

## Hard rules (don't break these)

1. **Always create a TodoList at the start of phase 1.** Six tasks,
   one per phase, in order. Mark phase N in-progress before you begin
   it, completed when done. If the user adds work mid-flight, append
   new tasks — never delete the original six.

2. **Always use `AskUserQuestion` to pick the license.** Never assume
   MIT. Never write a license from memory. The script downloads the
   canonical text from GitHub — that's the whole point.

3. **Always produce both `README.md` and `README.hu.md`** unless the
   user explicitly opts out. The Hungarian file mirrors the English
   one section-for-section; it is **not** a translation in the
   linguistic sense (see phase 5 above).

4. **Never ship a README with a `TODO:` placeholder** in the body. If
   you don't know a section, omit the section.

5. **Never invent a tagline or feature list.** If the project doesn't
   tell you what it does, ask. A README that lies about what the
   project does is worse than no README.

6. **No emojis in header lines.** Emoji can go in callout blocks
   *above* a header, but the header itself must be plain text so
   GitHub's auto-anchor generator produces predictable URLs.

7. **One install command that actually works** must be visible in the
   first 20 lines. If install is multi-step, lead with the shortest
   one and link out for the long version.

8. **Length budget: 80–250 lines of prose + code.** Below 80 looks
   thin; above 250, split to `docs/`.

9. **No external image hosting you don't control.** If you reference a
   screenshot, either commit the PNG to the repo or use a placeholder
   block the user can replace. Don't hotlink to random blogs.

10. **Always read the template file before filling it in.** The
    templates are short; the temptation to "remember" what they
    contain is what causes the inconsistencies the skill exists to
    prevent.

11. **Put decorative icons *outside* the link and the bold markers,
    not inside them.** When a line pairs an emoji with a bold link
    (language switchers, docs-table rows, a "live demo" call-to-action),
    write `📦 **[Telepítés](docs/hu/installation.md)**` — emoji first,
    then the bold link. Do **not** bury the emoji inside the link text
    or between the `**` and the `[`, like `**[📦 Telepítés](…)**` or
    `[📦 **Telepítés**](…)`. Why: the icon is decoration, not a click
    target — pulling it out of the `[…]` keeps the clickable area to the
    actual words, keeps the link text clean (so GitHub's hover preview
    and screen readers announce just the label), and renders the bold
    consistently. The house form is always: `<emoji> **[<label>](<url>)**`.

## Tone and style of the skill itself

When you (the agent) are using this skill to write a README:

- Be **terse in chat**, verbose in the file. The user's chat
  transcript should show 5–10 short status lines, not a wall of
  prose. Save the prose for the README itself.
- **Quote the section headers** in chat, not the contents. "I wrote
  the `## Installation` section" is more useful to the user than
  pasting the section.
- **Never apologize for asking questions** in phase 1 or 2. The
  questions are the skill — they're why the output is good.
- **Default to action.** If the project is unambiguous (e.g. a
  Python library with a `pyproject.toml` that already names itself),
  don't ask 5 clarifying questions — ask one (the license) and go.

## License

The skill itself is MIT-licensed. See `LICENSE` in the project root.
