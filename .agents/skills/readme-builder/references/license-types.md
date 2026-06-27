# License types supported by `download_license.py`

The bundled script downloads the **canonical, SPDX-accurate license
text** from GitHub's official license API:

```
GET https://api.github.com/licenses/{spdx-id}
```

The endpoint returns JSON with this shape:

```json
{
  "key": "mit",
  "name": "MIT License",
  "spdx_id": "MIT",
  "url": "https://api.github.com/licenses/mit",
  "html_url": "https://choosealicense.com/licenses/mit/",
  "description": "A short and simple permissive license...",
  "category": "Permissive",
  "implementation": "...",
  "permissions": ["commercial-use", "modifications", ...],
  "conditions": ["include-copyright"],
  "limitations": ["liability", "warranty"],
  "body": "<the actual full license text, with [year] and [fullname] placeholders>"
}
```

The script writes the `body` field to `LICENSE` after substituting
`[year]` → current year and `[fullname]` → the copyright holder name
the user provided.

## SPDX IDs the AskUserQuestion menu must offer

These are the **first-class options** the skill presents. They cover
~98% of open-source projects in 2026 and all of them are guaranteed
to be present at the GitHub endpoint.

| SPDX id | When to recommend | First-class in `AskUserQuestion`? |
|---|---|---|
| `MIT` | Default for Node, Python, Go, Rust, Ruby, PHP, most JS/TS projects. Permissive, ~200 words, lawyer-approved. | **Yes** (Recommended unless project signals otherwise) |
| `Apache-2.0` | Java, Kotlin, Scala, Go, Swift, anything patent-sensitive. Adds an explicit patent grant that MIT lacks. | **Yes** |
| `GPL-3.0` | The user says "copyleft" or "GPL", or the project is a compiler / library that wants to ensure derivatives stay open. | **Yes** |
| `BSD-3-Clause` | Permissive, similar to MIT, adds a non-endorsement clause. Common in academic / scientific code. | **Yes** |
| `BSD-2-Clause` | Permissive, even shorter than BSD-3. Common in older Go projects. | Optional — fall back to "Other" |
| `ISC` | Functionally equivalent to MIT, slightly shorter. Common in old npm packages. | Optional — fall back to "Other" |
| `MPL-2.0` | File-level copyleft; common in Firefox-adjacent projects. | Optional — fall back to "Other" |
| `Unlicense` | Public-domain dedication, no attribution required. Common for tiny utility scripts. | Optional — fall back to "Other" |
| `LGPL-3.0` | Weak copyleft for libraries that want to allow linking from proprietary code. | Optional — fall back to "Other" |
| `AGPL-3.0` | Network copyleft — closing the "service-provider loophole" in GPL. | Optional — fall back to "Other" |
| `CC0-1.0` | Public domain dedication for non-code assets (docs, datasets, fonts). | Optional — fall back to "Other" |
| `WTFPL` | "Do What The F*ck You Want To Public License". Not OSI-approved; do not use for serious projects. | **Never** recommend |

The `AskUserQuestion` tool always provides an "Other" escape hatch
automatically, so you don't need to add it — the system gives the user
a free-text box. The 3–4 you pick from this table are the **menu
items**, and the "Other" lets the user name anything else (e.g.
`LGPL-2.1`, `EPL-2.0`, a custom corporate license, "I'll provide the
text myself").

## What to do if the user picks a license that isn't in the bundled list

The script accepts **any SPDX id** — it just plugs it into the URL.
The supported list above is *which licenses we trust the script to
handle without confirmation*. If the user picks something exotic:

1. Run the script with the SPDX id they gave you.
2. If the API returns 200, write the file as normal.
3. If the API returns 404 (unknown SPDX id), **stop and ask the user**
   for the canonical text or a correct SPDX id. Do **not** invent one.

## What to do if the network is down

If the API call fails (offline workstation, blocked egress, DNS
issue), **stop the skill**. Tell the user:

> "I can't reach `api.github.com` from this environment, which means I
> can't download the canonical `LICENSE` text. Two options:
> 1. Run the skill on a machine with internet access, or
> 2. Paste the canonical license text yourself and I'll skip the
>    download step and use what you provide."

**Never** write a hand-typed license. Every popular open-source
license has a specific canonical text (e.g. MIT is *not* just "MIT
License — do whatever, no warranty"; the actual MIT text is ~180
words and includes the copyright line and the permission grant).
Paraphrasing is a real legal risk.

## The `.license-meta.json` sidecar

After a successful download, the script writes:

```json
{
  "spdx_id": "MIT",
  "year": 2026,
  "copyright_holder": "Jane Developer",
  "downloaded_at": "2026-06-16T14:32:00Z",
  "source_url": "https://api.github.com/licenses/mit"
}
```

This file is read by the README-authoring phase to:

- Build the license badge URL: `https://img.shields.io/badge/License-{spdx_id}-{color}.svg`
- Render the copyright line: `Copyright (c) {year} {copyright_holder}`
- Render the SPDX-id paragraph at the bottom of the README: "This
  project is licensed under the {spdx_id} License — see the [LICENSE](LICENSE)
  file for details."

Add `.license-meta.json` to `.gitignore` only if you're worried about
leaking the copyright holder's name in CI logs. Most projects commit
it.

## Decision tree for the skill

```
Is the project name suggesting a particular license?
├── Yes, mentions "GPL" / "copyleft" / "share-alike" → GPL-3.0 (ask to confirm)
├── Yes, mentions "Apache" / "patent" / "Java"       → Apache-2.0 (ask to confirm)
└── No                                                → default menu with MIT first

Does the user pick a first-class option?
├── Yes → run script with that SPDX id
└── No  → user typed something; run script with their SPDX id
         ├── 200 → great
         └── 404 → stop and ask
```
