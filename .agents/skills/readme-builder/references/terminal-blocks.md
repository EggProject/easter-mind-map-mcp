# Terminal-window-style code blocks

> How to make a code block or a CLI session *look* like a macOS
> terminal window (the dark window with the three red/yellow/green
> "traffic light" buttons) in a README — and when not to bother.

## The one thing to know first

**Plain Markdown can't do this, and neither can HTML+CSS on GitHub.**
A fenced ` ``` ` block only ever gets syntax highlighting — no window
chrome, no traffic-light dots. And GitHub.com sanitizes README HTML:
no `<style>`, no inline `style=`, no CSS classes. So the only reliable
way to get a terminal-window look on github.com is to **render an
image (SVG/PNG) or an animation and embed it** with `![alt](path)`.

(If the README is rendered by something *other* than github.com — a
docs site like MkDocs Material, Docusaurus, or VitePress — you can
style a `<div class="terminal">` with the theme's own CSS. That's out
of scope here; this guide targets a normal GitHub README.)

## Decide first: do you even need an image?

An image is heavier than a code block: it can't be copy-pasted, it
isn't searchable, screen readers only get the alt text, and it can go
stale. So **default to a plain fenced code block** for anything a
reader might want to copy (install commands, config snippets, API
examples). Reach for a terminal image only when the *visual* is the
point:

- A **hero/demo** at the top of a CLI tool's README, to sell what the
  tool feels like to use.
- Output where **color or layout matters** (a colored diff, a TUI, a
  progress bar, a syntax-highlighted REPL session).
- A short **"this is what success looks like"** moment.

When you do embed an image, it's good practice to *also* keep a plain
fenced block nearby with the copy-pasteable commands — the image is
the pitch, the code block is the utility.

## Decide second: static image or animation?

This is the core choice. Pick by **whether time matters**:

| Use a **code→image renderer** (static) when… | Use an **animated terminal** when… |
|---|---|
| You're showing a **snapshot** — one command and its output, a config file, a code sample. | You're showing a **process** — typing, a spinner/progress bar, output appearing step by step. |
| The reader needs to *read* it, not *watch* it. | The "wow" is in the motion (a 10-second end-to-end demo). |
| You want it crisp at any zoom and tiny in bytes → **SVG**. | You want a looping GIF/animated SVG in the hero slot. |
| Example: a `library` usage snippet styled like an editor window. | Example: a `cli-tool` demo: `mytool init` → progress → "Done ✓". |

Rule of thumb: **static covers ~80% of READMEs.** Only animate when a
still frame genuinely fails to convey the experience — animations are
bigger, can be distracting, and are harder to regenerate.

## Tools (and how to install them into the skill's own `tmp/`)

**Installation policy — keep it local to the skill.** If a tool isn't
already on the machine, do **not** install it globally. Create a
`tmp/` directory **inside the skill's own folder** (the directory that
contains this `references/`), install there, and run it from there.
This keeps the user's system clean and makes cleanup a single
`rm -rf <skill-dir>/tmp`. `tmp/` is gitignored (see the skill root
`.gitignore`), so nothing leaks into version control. Below,
`$SKILL` means the absolute path to the skill directory.

Before installing anything, check whether it's already available
(`command -v freeze`, `command -v vhs`, etc.) and just use it if so.

### Static — code→image renderers

| Tool | Best for | Output | Install into `tmp/` |
|---|---|---|---|
| **`freeze`** (charmbracelet) | **Default pick.** Code *and* terminal output, real macOS window chrome via `--window`, SVG/PNG. | SVG, PNG | `GOBIN=$SKILL/tmp/bin go install github.com/charmbracelet/freeze@latest` → run `$SKILL/tmp/bin/freeze` |
| **`silicon`** | Code snippets, offline, no browser. | PNG | `cargo install --root $SKILL/tmp silicon` → run `$SKILL/tmp/bin/silicon` |
| **Carbon** / `carbon-now-cli` | Prettiest code shots; needs network (headless Chrome). | PNG, SVG | `npm install --prefix $SKILL/tmp carbon-now-cli` → run `$SKILL/tmp/node_modules/.bin/carbon-now` |

For a terminal-window look specifically, **`freeze` is the
recommendation**: it has a built-in `--window` flag that draws the
title bar and the three traffic-light buttons, and it can render
*captured terminal output* (with ANSI colors), not just source code.

```bash
# Static terminal-window SVG from a captured command's output:
mytool --help > $SKILL/tmp/out.txt
$SKILL/tmp/bin/freeze --window --output docs/cli-help.svg $SKILL/tmp/out.txt
```

### Animated — recorded terminal sessions

| Tool | Best for | Output | Install into `tmp/` |
|---|---|---|---|
| **`vhs`** (charmbracelet) | **Default pick.** A `.tape` script (deterministic, re-runnable, reviewable in PRs). | GIF, MP4, WebM | `GOBIN=$SKILL/tmp/bin go install github.com/charmbracelet/vhs@latest` → run `$SKILL/tmp/bin/vhs` (needs `ttyd` + `ffmpeg`) |
| **`asciinema`** + **`svg-term`** | A real recorded session → standalone animated SVG (no GIF weight). | animated SVG | `python3 -m venv $SKILL/tmp/venv && $SKILL/tmp/venv/bin/pip install asciinema`; `npm install --prefix $SKILL/tmp svg-term-cli` |

Prefer **`vhs`** for READMEs: because the recording is a checked-in
`.tape` script rather than a hand-typed live session, anyone can
regenerate the exact same demo later when the CLI changes — no
re-recording by hand, no typos mid-demo.

```bash
# demo.tape (committed to the repo, e.g. in docs/):
#   Output docs/demo.gif
#   Type "mytool init my-project"
#   Enter
#   Sleep 2s
$SKILL/tmp/bin/vhs docs/demo.tape   # writes docs/demo.gif
```

## Where the output goes, and how to embed it

The rendered image is an **asset of the target project**, not of the
skill. Commit it into the project's `docs/` folder (consistent with
hard rule #9 — never hotlink images you don't control), then embed it:

```markdown
![<project> running `init` in a terminal](docs/demo.svg)
```

- **Always write meaningful alt text** — it's the only thing a screen
  reader gets. "Demo of mytool" is weak; "mytool scaffolding a new
  project, showing the progress bar and the final 'Done' line" is
  useful.
- **Prefer SVG** for static shots (crisp, small, theme-agnostic). Use
  GIF/MP4 only for animation.
- Keep hero images reasonably sized (≤ ~1 MB for GIFs) so the README
  renders fast — the same first-impression logic as the screenshot
  rule in `style-guide.md`.

## Clean up

When you're done generating images, remove the toolchain:

```bash
rm -rf $SKILL/tmp
```

The generated images already live in the target project's `docs/`, so
deleting `tmp/` loses nothing.

## Quick checklist

1. Does this block need to be an image at all, or is a fenced code
   block enough? (Default: code block.)
2. Static snapshot or animated process? (Default: static.)
3. Tool already installed? If not, install into `$SKILL/tmp` and run
   from there — never globally.
4. Output written to the **project's** `docs/`, embedded with
   meaningful alt text.
5. `rm -rf $SKILL/tmp` when finished.
