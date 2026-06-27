# <Projekt neve>

> <Egysoros tagline, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![Verzió](https://img.shields.io/badge/verzi%C3%B3-<version>-blue.svg)](https://github.com/<owner>/<repo>/releases)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Deploy](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](#)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

> Képernyőkép a fő nézetről.

![Képernyőkép a(z) <projekt-név>-ről](docs/screenshot.png)

## Mi ez?

**`<projekt-név>`** egy webalkalmazás, amely `<X>-t csinál` `<Y>`
számára. A `<versenytárs>`-tól eltérően `<megkülönböztető
tulajdonság>`.

🚀 **[Próbáld ki az élő demót →](https://<projekt-név>.example.com)**

## Tech stack

- **Keretrendszer:** <pl. Next.js 14>
- **Stílus:** <pl. Tailwind CSS>
- **State management:** <pl. Zustand>
- **Tesztelés:** <pl. Vitest + Playwright>
- **Deploy:** <pl. Vercel>

## Helyi fejlesztés

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
npm install
cp .env.example .env.local   # töltsd ki az API kulcsokat
npm run dev
```

Az alkalmazás a `http://localhost:3000` címen szolgál.

## Deployment

Push a `main` ágra és a Vercel automatikusan deployol. A self-hosted
beállításokat lásd [docs/deployment.md](docs/deployment.md)-ben.

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
