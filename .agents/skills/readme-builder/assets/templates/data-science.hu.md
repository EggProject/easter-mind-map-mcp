# <Projekt neve>

> <Egysoros tagline a kutatásról / modellről, ≤ 20 szó>.

[![Licenc: <SPDX>](https://img.shields.io/badge/Licenc-<SPDX>-<color>.svg)](LICENSE)
[![DOI](https://img.shields.io/badge/DOI-10.xxxx/zenodo.xxxxx-blue)](#hivatkozas)
[![Build állapot](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![Angol](https://img.shields.io/badge/Docs-Angol-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇬🇧 **[English version →](README.md)**

---

## Mi ez?

**`<projekt-név>`** egy `<modell / elemzés / kísérlet>`, amely
`<X>-t csinál` `<Y>` számára. A kutatási kérdés: *"<az a kérdés,
amelyre ez a projekt választ ad>"*.

## Eredmények

![Eredmény diagram](docs/result.png)

| Modell | Pontosság | F1 | Latency |
|---|---|---|---|
| Alapvonal | 0.81 | 0.79 | 12 ms |
| Miénk | **0.87** | **0.85** | 18 ms |

A teljes értékelést lásd [docs/results.md](docs/results.md)-ben.

## Datasetek

| Dataset | Licenc | Hivatkozás |
|---|---|---|
| `<dataset-a>` | CC-BY-4.0 | [paper](https://arxiv.org/abs/xxxx.xxxxx) |
| `<dataset-b>` | ODbL | [paper](https://arxiv.org/abs/yyyy.yyyyy) |

A datasetek letöltése:

```bash
mkdir -p data/
curl -L https://example.com/dataset-a.tar.gz | tar -xz -C data/
curl -L https://example.com/dataset-b.tar.gz | tar -xz -C data/
```

## Eredmények reprodukálása

Hardver: 1× NVIDIA A100 (40 GB), CUDA 12.1, 64 GB RAM.
Futásidő: ~6 óra a teljes training sweep-re.

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
pip install -r requirements.txt
jupyter notebook notebooks/main.ipynb
```

A notebook letölti a dataseteket, traineli a modellt, és az
eredményeket a `results/` mappába írja.

## Hivatkozás

Ha ezt a munkát egy paperben felhasználod, kérlek hivatkozz rá:

```bibtex
@article{<szerző><év>,
  title={<cím>},
  author={<Author, A.>},
  journal={arXiv preprint arXiv:xxxx.xxxxx},
  year={<év>}
}
```

## Közreműködés

A PR-okat szívesen fogadjuk. A munkafolyamatot lásd
[CONTRIBUTING.md](CONTRIBUTING.md)-ben.

## Licenc

Copyright (c) <év> <szerzői jog tulajdonosa>

Ez a projekt a(z) <SPDX> licenc alatt áll — a teljes szöveget lásd
a [LICENSE](LICENSE) fájlban.
