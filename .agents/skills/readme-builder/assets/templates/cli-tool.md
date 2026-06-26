# <Project Name>

> <One-line tagline, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

## What is this?

**`<cli-name>`** is a command-line tool that does `<X>` for `<Y>`.
Unlike `<competitor>`, it `<differentiator>`.

## Demo

```
$ <cli-name> init
✓ Initialized <thing> in current directory

$ <cli-name> build
✓ Built 3 assets in 1.2s
```

## Installation

```bash
# Pick the install command that matches the language:
brew install <cli-name>          # macOS / Linux (Homebrew)
npm install -g <cli-name>        # Node / npm
cargo install <cli-name>         # Rust / cargo
pipx install <cli-name>          # Python
scoop install <cli-name>         # Windows (Scoop)
```

## Usage

| Command | Description |
|---|---|
| `<cli-name> init` | Initialize a new project in the current directory. |
| `<cli-name> build` | Build the project for production. |
| `<cli-name> test` | Run the test suite. |
| `<cli-name> deploy` | Deploy the project to the configured target. |
| `<cli-name> --help` | Show the full command reference. |

See [docs/commands.md](docs/commands.md) for the full command list
and options.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `<CLI_NAME>_CONFIG` env var | `~/.config/<cli-name>/config.yml` | Path to the config file. |
| `<CLI_NAME>_LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error`. |

## Contributing

PRs welcome. Please open an issue first for non-trivial changes.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
