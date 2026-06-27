# <Project Name>

> <One-line tagline describing the research / model, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![DOI](https://img.shields.io/badge/DOI-10.xxxx/zenodo.xxxxx-blue)](#citation)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](#)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

## What is this?

**`<project-name>`** is a `<model / analysis / experiment>` that
`<does X>` for `<Y>`. The research question is: *"<the question
this project answers>"*.

## Results

![Result chart](docs/result.png)

| Model | Accuracy | F1 | Latency |
|---|---|---|---|
| Baseline | 0.81 | 0.79 | 12 ms |
| Ours | **0.87** | **0.85** | 18 ms |

See [docs/results.md](docs/results.md) for the full evaluation.

## Datasets

| Dataset | License | Citation |
|---|---|---|
| `<dataset-a>` | CC-BY-4.0 | [paper](https://arxiv.org/abs/xxxx.xxxxx) |
| `<dataset-b>` | ODbL | [paper](https://arxiv.org/abs/yyyy.yyyyy) |

Download the datasets:

```bash
mkdir -p data/
curl -L https://example.com/dataset-a.tar.gz | tar -xz -C data/
curl -L https://example.com/dataset-b.tar.gz | tar -xz -C data/
```

## Reproducing the results

Hardware: 1× NVIDIA A100 (40 GB), CUDA 12.1, 64 GB RAM.
Runtime: ~6 hours for the full training sweep.

```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
pip install -r requirements.txt
jupyter notebook notebooks/main.ipynb
```

The notebook downloads the datasets, trains the model, and writes
results to `results/`.

## Citation

If you use this work in a paper, please cite:

```bibtex
@article{<author><year>,
  title={<title>},
  author={<Author, A.>},
  journal={arXiv preprint arXiv:xxxx.xxxxx},
  year={<year>}
}
```

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
