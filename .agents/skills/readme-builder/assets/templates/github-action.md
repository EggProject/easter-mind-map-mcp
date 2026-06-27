# <Action Name>

> <One-line tagline describing what the action does, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Marketplace](https://img.shields.io/badge/Marketplace-install-blue?logo=github-actions)](https://github.com/marketplace/actions/<slug>)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

## What is this?

**`<action-name>`** is a reusable GitHub Action that does `<X>` for
`<Y>`. Use it in any workflow to `<differentiator>`.

## Usage

```yaml
- uses: <owner>/<action-name>@v1
  with:
    input1: 'value'
    input2: 'default-value'
- run: echo "Action ran"
```

A full example workflow:

```yaml
name: CI
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: <owner>/<action-name>@v1
        with:
          input1: 'value'
      - run: echo "Done"
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `input1` | Yes | — | The path to the input file. |
| `input2` | No | `'default-value'` | A toggle: `true` enables X, `false` skips it. |
| `github-token` | No | `${{ github.token }}` | Token used for GitHub API calls. |

## Outputs

| Output | Description |
|---|---|
| `result` | The action's main result (string). |
| `count` | The number of items processed (integer). |

## Building from source

```bash
git clone https://github.com/<owner>/<action-name>.git
cd <action-name>
npm install
npm run build
npm run package
```

The packaged action lands in `dist/`.

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
