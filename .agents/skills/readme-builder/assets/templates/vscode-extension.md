# <Extension Name>

> <One-line tagline describing what the extension does, ≤ 20 words>.

[![License: <SPDX>](https://img.shields.io/badge/License-<SPDX>-<color>.svg)](LICENSE)
[![Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/<publisher>.<name>?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/<publisher>.<name>)](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/<publisher>.<name>)](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)
[![English](https://img.shields.io/badge/Docs-English-blue)](README.md)
[![Magyar](https://img.shields.io/badge/Docs-Magyar-green)](README.hu.md)

🇭🇺 **[Magyar verzió →](README.hu.md)**

---

> Demo of <extension-name> in action.

![Demo GIF](docs/demo.gif)

## What is this?

**`<extension-name>`** is a Visual Studio Code extension that does
`<X>`. Unlike `<competitor>`, it `<differentiator>`.

## Installation

Install from the VS Code Marketplace:

[<img src="https://img.shields.io/badge/VS_Code-Install-blue?style=for-the-badge&logo=visual-studio-code" alt="Install from VS Code Marketplace">](https://marketplace.visualstudio.com/items?itemName=<publisher>.<name>)

Or via the command line:

```bash
code --install-extension <publisher>.<name>
```

## Configuration

Add to your `settings.json`:

```json
{
  "<name>.enable": true,
  "<name>.maxLineLength": 100,
  "<name>.formatOnSave": true
}
```

| Setting | Default | Description |
|---|---|---|
| `<name>.enable` | `true` | Enable the extension. |
| `<name>.maxLineLength` | `100` | Max line length for the formatter. |
| `<name>.formatOnSave` | `true` | Run the formatter on save. |

## Commands

| Command | Description |
|---|---|
| `extension.doSomething` | Run the main action on the active file. |
| `extension.format` | Run the formatter on the active file. |
| `extension.toggle` | Toggle the extension on / off. |

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
workflow.

## License

Copyright (c) <year> <copyright_holder>

This project is licensed under the <SPDX> License — see the
[LICENSE](LICENSE) file for the full text.
