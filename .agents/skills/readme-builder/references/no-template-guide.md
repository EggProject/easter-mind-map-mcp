# The no-template authoring path

> Use this when the project type doesn't match any template in
> `assets/templates/`. The skill's templates cover ~95% of
> open-source projects, but the long tail is real: a Chrome
> extension isn't quite a web app, a Terraform module isn't quite
> a library, a Kubernetes operator isn't quite an API service.
> This guide is for that long tail.

## When to use this guide

Use the no-template path when **any** of the following is true:

1. The project type isn't in `assets/templates/INDEX.md`.
2. The user explicitly says "I don't want a template, just help me
   write it" or "use a custom structure".
3. The closest template would require so much editing that the
   final README has < 50% of the original template's structure
   (in which case the template is actively misleading).
4. The project is a non-code artifact (a documentation site, a
   configuration repo, a design system, a font, a dataset).

Don't use the no-template path just because a template is *close*
but not perfect. A 70% match is still a template — fill in the 30%
delta yourself.

## The eight canonical sections

Every good README has these eight sections, in some form. The order
is *roughly* this, but for unusual projects the order can shift.
The skill's house rule: if you change the order, justify it in your
phase-1 mental model ("a Terraform module README leads with Usage
because the resource graph is the API").

### 1. Title + one-line tagline

The first thing a reader sees. Format:

```markdown
# <Project Name>

> <One-sentence description, ≤ 20 words>.
```

If the project has a logo, put it next to the title. The tagline
is the most important sentence in the README — it's the project
described in 20 words. If you can't write the tagline, you don't
yet understand the project well enough to write the README.

### 2. Badges

3–6 badges, in this priority order:

1. License (always)
2. Language (always — English, linking to `README.md`)
3. Project-type specific (marketplace, app store, npm, PyPI, etc.)
4. Build / CI status
5. Version
6. Downloads / install count / stars

See `references/style-guide.md` for badge URL patterns and color
semantics.

### 3. Description

A short paragraph (≤ 4 lines) that answers:

- What is the project? (Category: e.g. "a Kubernetes operator")
- What does it do? (Function: e.g. "automates the lifecycle of...")
- Who is it for? (Audience: e.g. "platform engineers running...")
- Why does it exist? (Motivation: e.g. "the manual `kubectl`
  workflow for X is error-prone and slow")

The "why does it exist" half is the part most READMEs skip — and
it's the part that makes a reader care.

### 4. Screenshots / demo / output (project-type-dependent)

If the project has visual output, a screenshot or a terminal
recording is non-negotiable. If it doesn't (a library, a CLI
without a demo, a config tool), skip this section — don't write
"## Screenshots" and leave it empty.

For a CLI / a tool with text output, the equivalent of a screenshot
is a **terminal recording** (asciinema SVG, VHS tape file, or a
plain code block of sample output). See `references/terminal-blocks.md`
for how to render a macOS terminal-window image or animation, when to
pick static vs animated, and the `tmp/` tool-install policy.

### 5. Installation

The *one command* the user needs to run. If install is multi-step,
lead with the shortest version and link to `docs/installation.md`
for the long one.

The first 20 lines of the README should answer "what is this?"
and "how do I run it?" — anything else is below the fold.

### 6. Usage

The *one example* the user can copy-paste. If the project has
multiple use cases, pick the most common one and link out for the
others.

For a library: one import + one function call.
For a CLI: one install + one command + the output.
For a service: one `curl` call + the response.
For a config tool: a sample config + the command that consumes it.
For an unusual project (operator, plugin, firmware): one full
end-to-end example.

### 7. Contributing

A short paragraph + a link to `CONTRIBUTING.md` (if it exists).
The short paragraph should answer:

- Are PRs welcome? (Default: yes)
- Is there a code style / linter? (Mention it: "Run `npm test`
  before pushing")
- Is there a `CODE_OF_CONDUCT.md`? (Link it)

### 8. License

One short paragraph + a link to the `LICENSE` file. Use the SPDX
id from phase 2:

```markdown
## License

Copyright (c) {year} {copyright_holder}

This project is licensed under the {spdx_id} License — see the
[LICENSE](LICENSE) file for the full text.
```

If the project bundles third-party assets with their own licenses
(fonts, datasets, sample images), mention them here.

## The "what should this section answer" prompt sheet

For unusual project types, the right move is to write a 1–3
sentence "what should this section answer" note *before* you
draft the section. This forces you to think about the reader's
question before you think about the answer.

Examples:

| Project type | Section | What this section should answer |
|---|---|---|
| Kubernetes operator | Install | "Can I install this on a cluster I don't control?" |
| Kubernetes operator | Usage | "Show me the smallest possible CRD that does something useful." |
| Chrome extension | Install | "Can I install this from the Chrome Web Store, or only from source?" |
| Terraform module | Usage | "Show me a `module {}` block I can copy-paste." |
| WordPress plugin | Install | "Do I `wp plugin install <name>` or upload a zip?" |
| VS Code theme | Install | "How do I apply this theme once it's installed?" |
| Firmware | Build | "What toolchain, what board, what command?" |
| Dataset | Usage | "What's the file format, the license, the citation?" |
| Font | Install | "Is this a `.ttf`, `.otf`, or a webfont? How do I embed it?" |
| Configuration repo | Usage | "How do I use the configs — clone, submodule, or package manager?" |

You don't need to write this prompt sheet into the README — it's
for *you*, the author, to internalize the reader's question before
drafting the answer.

## The 12-question README Sanity Checklist

Run this after you've drafted the README. Every "no" is a fix
you should make before showing the file to the user.

1. **Can a reader tell what the project is in ≤ 5 seconds?**
   (Look at the first 5 lines only.)
2. **Is there a one-command install in the first 20 lines?**
3. **Is there a copy-paste-runnable usage example?**
4. **Is the license SPDX-id'd in both the badge and the License
   section?**
5. **Are all the code blocks actually valid?**
   (Test each one. A `python` block with a JS example is worse
   than no block at all.)
6. **Is the tone declarative?**
   (Grep for "can be", "is able to", "has been designed to" —
   these are all flags to rewrite.)
7. **Is the total length 80–250 lines of prose + code?**
   (If under 80, add a motivation / "Why this project?" section.
   If over 250, split into `docs/`.)
8. **Are there any `TODO:` placeholders in the body?**
   (If yes, either fill them in or remove the section.)
9. **Is the project-type appropriate?**
   (E.g. a CLI README should have a command table; a web-app
   README should have a screenshot.)
10. **Are all internal links correct?**
    (Click each one. A `(#install)` anchor pointing to a header
    that doesn't exist is broken.)
11. **Is the Hungarian mirror consistent with the English one?**
    (Same sections, in the same order, with a bilingual link
    at the top.)
12. **Is the LICENSE file actually present and downloaded from
    GitHub?**
    (Verify with `cat LICENSE | head -5` — the first line should
    be a copyright line matching the SPDX id.)

If any answer is "no", fix it before reporting back to the user.

## Worked example: Kubernetes operator

A Kubernetes operator doesn't match any template directly. Closest
would be `api-service.md`, but the operator's primary "API" is a
**CustomResourceDefinition** (CRD), not an HTTP endpoint. So:

1. **Title**: `kube-foo-operator: lifecycle management for the Foo
   custom resource`.
2. **Badges**: license, GoReportCard, container registry
   (quay.io / ghcr.io), release.
3. **Description**: "kube-foo-operator automates the lifecycle of
   `Foo` custom resources in your cluster. Define a `Foo` in YAML,
   the operator handles create / read / update / delete, including
   backup and restore."
4. **No screenshots** — operators are headless. Skip this section.
5. **Installation**:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/<owner>/<name>/main/deploy/install.yaml
   ```
6. **Usage** — show a small CRD YAML and a `kubectl get foos`:
   ```yaml
   apiVersion: foo.example.com/v1
   kind: Foo
   metadata:
     name: my-foo
   spec:
     replicas: 3
   ```
   ```bash
   $ kubectl get foos
   NAME      STATUS    REPLICAS   AGE
   my-foo    Ready     3          10s
   ```
7. **CRD reference** — link to `docs/crd.md` for the full spec.
8. **Contributing + License**.

The structure is 80% the same as `api-service.md`, but the
"endpoints" table is replaced by a CRD example, and there's no
auth section (operators use Kubernetes RBAC, which is documented
in `docs/rbac.md`).

## Worked example: Terraform module

A Terraform module is a reusable piece of infrastructure-as-code.
Closest template is `library.md`, but the "import" is a `module {}`
block, not a `require` / `import` statement.

1. **Title**: `terraform-aws-foo: opinionated Terraform module for
   deploying Foo on AWS`.
2. **Badges**: license, Terraform Registry, build status.
3. **Description**: "This module provisions a fully-configured Foo
   cluster on AWS, including VPC, subnets, IAM, and monitoring.
   Designed for production use; tested with Terraform 1.5+."
4. **No screenshots** — Terraform modules don't have visual output.
5. **Usage**:
   ```hcl
   module "foo" {
     source  = "<owner>/<name>"
     version = "1.2.3"

     cluster_name = "my-foo"
     instance_type = "m5.large"
     min_size     = 3
     max_size     = 10
   }
   ```
6. **Inputs / Outputs** — link to the Terraform Registry page or
   `docs/variables.md`.
7. **Examples** — link to `examples/` folder.
8. **Contributing + License**.

Again, 80% `library.md`, 20% Terraform-specific.

## Worked example: a font

A font is a non-code artifact. There's no install command, no
usage code, no API. The structure collapses to:

1. **Title + tagline**: "Inter: a typeface specially designed for
   user interfaces".
2. **Badges**: license (OFL-1.0), version, downloads.
3. **Hero image** — the font sample, big.
4. **Description** — who designed it, why, what's the design
   philosophy.
5. **Install** — for the web, `@font-face` block; for desktop,
   download link.
6. **Usage** — code:
   ```css
   @font-face {
     font-family: 'Inter';
     src: url('Inter-Regular.woff2') format('woff2');
     font-weight: 400;
   }
   ```
7. **License** — OFL-1.0 details.
8. **Credits + License** — designer, contributors.

The "Screenshots" section becomes "Hero image", the "Install"
section is platform-specific (web vs desktop), and there's no
Contributing section (the contributor list is the credits).

## Worked example: a documentation site

A documentation site (e.g. a VitePress / Docusaurus / MkDocs repo)
has a README that's mostly about the docs themselves.

1. **Title + tagline**: "VitePress Docs: the documentation site for
   Project X".
2. **Badges**: license, build status, deploy status, Netlify/Vercel.
3. **Live docs link** — the prominent URL, equivalent to the
   "Live demo" for a web app.
4. **Description** — one paragraph.
5. **Local development** — `npm install && npm run dev` + the URL.
6. **Adding a new page** — the one-paragraph "edit `docs/*.md`
   and submit a PR" note.
7. **Architecture** — one paragraph: "Built with VitePress,
   deployed to Netlify, sources live in `docs/`."
8. **Contributing + License**.

There's no "Usage" section in the library sense — the "usage" is
reading the docs. The "Install" section is really "Local
development".

## Final reminder

The no-template path is **not** a fallback for laziness. It's a
deliberate authoring exercise. A well-written bespoke README for a
Kubernetes operator is better than a library README with the words
"library" swapped out for "operator" — readers can tell.
