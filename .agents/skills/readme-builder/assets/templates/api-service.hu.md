# <Projekt neve>

> <Egysoros tagline, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Container](https://img.shields.io/badge/container-ghcr.io-blue?logo=docker)](#)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

## Mi ez?

**`<service-név>`** egy <protokoll — REST/GraphQL/gRPC> API a(z)
`<domain>` számára. `<X>`-et tesz elérhetővé, és `<Y>` használja.

## Endpointok

| Metódus | Útvonal | Leírás |
|---|---|---|
| `GET`  | `/api/v1/<erőforrás>` | <erőforrás> listázása. |
| `POST` | `/api/v1/<erőforrás>` | <erőforrás> létrehozása. |
| `GET`  | `/api/v1/<erőforrás>/{id}` | <erőforrás> lekérése ID alapján. |
| `PUT`  | `/api/v1/<erőforrás>/{id}` | <erőforrás> frissítése. |
| `DELETE` | `/api/v1/<erőforrás>/{id}` | <erőforrás> törlése. |

A teljes referenciát lásd [az OpenAPI specifikációban](docs/openapi.yaml)
vagy [docs/api.md](docs/api.md)-ben.

## Hitelesítés

Minden kérésnek tartalmaznia kell egy API kulcsot az `Authorization`
fejlécben:

```http
Authorization: Bearer <api-kulcs>
```

Szerezz ingyenes API kulcsot a <https://<service-név>.example.com/signup>
oldalon. Rate limit: 1000 kérés / óra / kulcs.

## Helyi fejlesztés

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
docker compose up
```

A szolgáltatás a `http://localhost:8080` címen szolgál. Health check:
`/healthz`.

## Deployment

A `Dockerfile` a repo része. Kubernetes / Nomad / bare-metal
receptek: [docs/deployment.md](docs/deployment.md).

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
