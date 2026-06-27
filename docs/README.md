# Documentation

🇭🇺 **[Magyar verzio ->](README.hu.md)**

This directory keeps the project documentation split by topic. Start with the
short README files at the repository root, then use these pages for operational
details.

## User documentation

| Page                                   | Purpose                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| [Installation](en/installation.md)     | Install dependencies, run checks, and connect an MCP host. |
| [Configuration](en/configuration.md)   | Environment variables and runtime directories.             |
| [Usage](en/usage.md)                   | How an MCP host should use the tools end to end.           |
| [Tool reference](en/tool-reference.md) | Tool inputs, outputs, and resource URIs.                   |
| [Architecture](en/architecture.md)     | Main components and data flow.                             |

## Engineering references

| Page                                                               | Purpose                                            |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| [MCP-TOOLS.md](MCP-TOOLS.md)                                       | LLM-facing tool list and required autonomous flow. |
| [UPSTREAM-CONTRACT.md](UPSTREAM-CONTRACT.md)                       | HTTP/SSE contract expected from MindGeniusAI.      |
| [ADR/0001-persistence-backend.md](ADR/0001-persistence-backend.md) | Persistence backend decision.                      |
| [ADR/0002-png-export.md](ADR/0002-png-export.md)                   | PNG export decision.                               |
