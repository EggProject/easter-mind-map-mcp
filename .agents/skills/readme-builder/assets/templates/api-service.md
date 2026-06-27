# <Project Name>

> <One-line tagline, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Container](https://img.shields.io/badge/container-ghcr.io-blue?logo=docker)](#)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

## What is this?

**`<service-name>`** is a <protocol — REST/GraphQL/gRPC> API for
`<domain>`. It exposes `<X>` and is used by `<Y>`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET`  | `/api/v1/<resource>` | List <resource>. |
| `POST` | `/api/v1/<resource>` | Create a <resource>. |
| `GET`  | `/api/v1/<resource>/{id}` | Get a <resource> by ID. |
| `PUT`  | `/api/v1/<resource>/{id}` | Update a <resource>. |
| `DELETE` | `/api/v1/<resource>/{id}` | Delete a <resource>. |

See [the OpenAPI spec](docs/openapi.yaml) or [docs/api.md](docs/api.md)
for the full reference.

## Authentication

All requests must include an API key in the `Authorization` header:

```http
Authorization: Bearer <api-key>
```

Get a free API key at <https://<service-name>.example.com/signup>.
Rate limit: 1000 requests / hour / key.

## Local development

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
docker compose up
```

The service serves on `http://localhost:8080`. Health check at
`/healthz`.

## Deployment

A `Dockerfile` is included. See [docs/deployment.md](docs/deployment.md)
for Kubernetes / Nomad / bare-metal recipes.

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
