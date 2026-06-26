# Style guide — the *why* behind phase 4's hard rules

This is the long-form explanation of every formatting and tone rule in
`SKILL.md`. Read it once when you first start using the skill, then
internalize the rules. You shouldn't need to re-read this for every
project — the SKILL.md has the short version, this file has the
*reasoning*.

## Why ASCII section headers (no emoji prefix)

GitHub auto-generates anchor URLs from header text using a specific
slugifier. Emoji break the slugifier in subtle ways:

| Header you write | Anchor GitHub generates |
|---|---|
| `## Installation` | `#installation` ✅ |
| `## 🔧 Installation` | `#-installation` (the emoji is converted to a dash) |
| `## Installation 🚀` | `#installation--` (trailing emoji becomes `--`) |
| `## Q&A` | `#qa` (the `&` is stripped, no separator) |
| `## C++ Support` | `#c-support` (the `+`s are stripped) |

The skill's house convention: **headers are plain text**, emoji goes
in a callout block *above* the header:

```markdown
> 🔧 **Get the project running on your machine.**

## Installation

```bash
npm install my-project
```
```

This keeps the anchors predictable (`#installation`) so deep links
from the README badge block and from social-media previews always
work, while still letting the README feel visually rich.

## Why icons go outside links (not inside)

When a line pairs a decorative emoji with a bold link — a language
switcher, a docs-table row, a "live demo" call-to-action — the icon
belongs *before* the link, outside both the `[…]` and the `**…**`:

| Avoid | Prefer |
|---|---|
| `**[📦 Telepítés](docs/hu/installation.md)**` | `📦 **[Telepítés](docs/hu/installation.md)**` |
| `[🇭🇺 **Magyar verzió** →](README.hu.md)` | `🇭🇺 **[Magyar verzió →](README.hu.md)**` |
| `[📖 Docs](docs/index.md)` | `📖 **[Docs](docs/index.md)**` |

The reasoning is about what the reader clicks and what assistive tech
reads aloud:

- **The icon is decoration, not a click target.** When the emoji is
  inside `[…]`, it becomes part of the hyperlink — the clickable area
  and GitHub's hover preview now include a wordless glyph. Pulling it
  out keeps the link surface to the actual label.
- **Screen readers announce the link text verbatim.** A link whose
  text is "📦 Telepítés" is read as "package Telepítés" (or worse, a
  raw codepoint). "Telepítés" alone is cleaner.
- **The bold renders consistently.** `**[label](url)**` reliably bolds
  the whole link on GitHub; emoji wedged between the `**` and the `[`
  (`**[📦 …`) is visually noisy and easy to get subtly wrong.

The house form is always the same shape, so every README the skill
produces matches: **`<emoji> **[<label>](<url>)**`** — emoji, space,
bold-wrapped link. This is hard rule #11 in `SKILL.md`.

## Why "one install command that works" must be in the first 20 lines

The 20-line rule is empirical. Studies of GitHub read-through rates
(showed up in the 2024 GitHub Octoverse report) consistently find
that ~60% of repo visitors never scroll past the first screen. If
they can't tell what the project is and how to run it within those
20 lines, they bounce. The README's first job is *not* to be
exhaustive — it's to be a sales pitch that ends with the reader
typing one command.

If install is genuinely multi-step (e.g. requires a database, an
API key, and a 5-minute migration), the README should still lead
with the *shortest possible version* (e.g. `docker run ...`) and
link to `docs/installation.md` for the long one.

## Why declarative, present tense, second person

| Avoid | Prefer |
|---|---|
| "You can run `npm install` to install the project" | "Run `npm install` to install the project" |
| "The CLI is able to accept three flags" | "The CLI accepts three flags" |
| "A function called `parse()` will be provided" | "`parse()` parses a MediaWiki wikitext string" |
| "This project has been designed to be fast" | "This project is fast — it parses 10 MB of wikitext in < 100 ms" |

The reason isn't pedantry — it's **scannability**. A README is read
on a phone screen in 30 seconds. Every word that isn't doing work
("can be", "is able to", "has been designed to") is a word the
reader has to skip over. Cut the modal verbs, cut the future tense,
cut the passive voice.

## Why no `TODO:` placeholders in the body

A README with `TODO:` lines screams "this project is unmaintained"
to a reader who has never seen the repo before. If you don't know
a section, the right move is to **omit the section entirely** —
not to leave a hole. A short, complete README (8 sections, all
filled in) is more credible than a long, half-empty one (15
sections, 6 of which say `TODO: write this`).

If a section is partially known (e.g. you have a CHANGELOG file
but it lives in a different repo), write a single line:

```markdown
## Changelog

See [the changelog repo](https://github.com/foo/bar/releases).
```

…and move on. One line is honest; `TODO: link here` is not.

## Why length budget 80–250 lines

- **Below 80** — the README looks thin. Readers wonder if the
  project is real, if it has a license, if anyone uses it. The fix
  is usually to add a "Why this project?" / motivation section, or
  a short "Showcase" / "Who uses this?" section.
- **Above 250** — the README is doing too much. The fix is to
  split into `docs/`:
  - `README.md` stays as the hub (80–250 lines)
  - `docs/installation.md` for the long install
  - `docs/usage.md` for the full usage guide
  - `docs/api.md` for the API reference
  - `docs/contributing.md` for the contributor guide
  - `docs/architecture.md` for design docs

  The hub README then has a "📖 Documentation" table linking to
  each `docs/*.md` file. Format each row with the icon *outside* the
  bold link, never inside it (see "Why icons go outside links" below):

  ```markdown
  | | |
  |---|---|
  | 📦 **[Installation](docs/installation.md)** | Full setup, all platforms |
  | 📖 **[Usage guide](docs/usage.md)** | Every command and flag |
  | 🔧 **[API reference](docs/api.md)** | The complete API surface |
  ```

## Why badges, but only 3–6

Badges are a quick visual signal of project health (license,
build status, version, downloads). They're also visual noise if
overdone. A README with 15 badges looks like a Christmas tree and
slows page render. The skill's rule: at least 3 (license, language,
project-type) and at most 6 (add build status, version, downloads
in that order of priority).

Badge URL pattern (shields.io is the de-facto standard):

```
https://img.shields.io/badge/{label}-{message}-{color}
```

Common colors: `blue` (info), `green` (positive), `yellow`
(caution), `red` (negative), `lightgrey` (neutral), `brightgreen`
(vibrant green for high version numbers). Pick colors
semantically, not decoratively.

## Why a "What is this?" section before "Installation"

Readers landing on a README from a search result or social-media
share usually have one question: "is this the project I'm looking
for?" If the first thing they see is a code block, they bounce. The
"Description" / "What is this?" / "Overview" section (one short
paragraph, ≤ 4 lines) is the README's actual sales pitch.

Template for the opening paragraph:

```markdown
**`<project-name>`** is a `<category>` that does `<X>` for `<Y>`.
Unlike `<competitor>`, it `<differentiator>`. Built with `<stack>`.
```

One sentence for what it is, one for why it's different, one for
the tech stack. That's it. Anything more belongs in `docs/`.

## Why a "Screenshots / Demo" section for visual projects

A web app, a desktop app, a UI library, a theme — anything visual
needs a screenshot in the README. Words can't sell what a 200×200
PNG can. The rule:

- First screenshot goes in the README, ≤ 600 px wide, ≤ 200 KB.
- Commit the PNG to the repo (e.g. `docs/screenshot.png`), don't
  hotlink.
- Caption it with one line: what the reader is looking at.

If the project has a CLI, the equivalent of a screenshot is a
**terminal recording** (e.g. an `asciinema` cast or an SVG of a
terminal session). These are 10× more effective than a code block
of sample output. See `references/terminal-blocks.md` for how to
render a terminal-window image (static vs animated, which tool, and
the `tmp/` install policy).

## Why the closing "License" section restates the SPDX id

The license badge at the top tells the reader *which* license. The
closing "License" section tells them *what that means in practice*
— in one paragraph. The template includes a stub:

```markdown
## License

Copyright (c) {year} {copyright_holder}

This project is licensed under the {spdx_id} License — see the
[LICENSE](LICENSE) file for the full text.
```

The closing section is also where you note any third-party license
obligations (e.g. "This project bundles `noto-sans` font, licensed
under OFL-1.1").

## Why the Hungarian mirror uses the *same* section order

When a reader switches from `README.md` to `README.hu.md` (or vice
versa), they expect to land on the same information. If the
Hungarian file has the Contributing section above the License
section, the reader's mental model breaks. The skill enforces:

- Same section headers, in Hungarian, in the same order.
- Same code blocks (untranslated).
- Same badge block (only the language badge changes).
- Same anchor count (GitHub auto-generates different anchors from
  the Hungarian text, but the *number* of headers should match).
