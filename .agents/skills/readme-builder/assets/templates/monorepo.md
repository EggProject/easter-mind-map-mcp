# <Monorepo Name>

> <One-line tagline describing the collection of packages, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

## What is this?

`<monorepo-name>` is a collection of `<N>` packages that together
provide `<X>`. It's a monorepo managed with `<pnpm / lerna / NX /
Turborepo / Bazel>`.

## Packages

| Package | Description | Version |
|---|---|---|
| [`@scope/core`](packages/core) | Core library. | ![npm](https://img.shields.io/npm/v/@scope/core) |
| [`@scope/cli`](packages/cli) | Command-line interface. | ![npm](https://img.shields.io/npm/v/@scope/cli) |
| [`@scope/web`](packages/web) | Web UI. | ![npm](https://img.shields.io/npm/v/@scope/web) |
| [`@scope/api`](packages/api) | HTTP API server. | ![npm](https://img.shields.io/npm/v/@scope/api) |
| [`@scope/shared`](packages/shared) | Shared types and utilities. | ![npm](https://img.shields.io/npm/v/@scope/shared) |

Each package has its own README with details. Start with
[`@scope/core`](packages/core) — most other packages depend on it.

## Quick start

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
pnpm install              # or `npm install` / `yarn`
pnpm build                # build all packages
pnpm test                 # test all packages
```

To work on a single package:

```bash
pnpm --filter @scope/cli dev     # run the CLI in dev mode
pnpm --filter @scope/web build   # build just the web UI
```

## Architecture

```
┌──────────┐     ┌──────────┐
│  @scope/ │────▶│  @scope/ │
│   web    │     │   core   │
└──────────┘     └──────────┘
      │                ▲
      ▼                │
┌──────────┐     ┌──────────┐
│  @scope/ │────▶│  @scope/ │
│   api    │     │  shared  │
└──────────┘     └──────────┘
```

- `@scope/core` is the dependency hub — most other packages depend on it.
- `@scope/shared` holds types and utilities that don't fit in `core`.
- `@scope/web` and `@scope/api` are the two deployable surfaces.

See [docs/architecture.md](docs/architecture.md) for the full
design doc.

## Contributing

PRs welcome. New packages go in `packages/`. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the monorepo workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
