---
paths:
  - "**/*.{ts,tsx}"
---

# scc — Fast Code Counter

**Path**: `scc` (v3.7.0)

Use for codebase metrics, complexity analysis, and COCOMO estimation.

## Key Flags
| Flag | Purpose |
|------|---------|
| `-i ts,tsx` | Filter by file extension |
| `-f json` | JSON output (for CI/tooling) |
| `--by-file` | Per-file breakdown |
| `-w` | Wide output with complexity ratio |
| `-c` | Skip complexity (faster) |
| `--no-cocomo` | Skip COCOMO estimation |
| `-a` | DRYness/duplication analysis |

## Examples
```bash
# TypeScript stats for a package
scc -i ts,tsx packages/ui

# Per-file complexity breakdown
scc -w --by-file -i ts,tsx packages/ui

# Quick count (no complexity)
scc -c --no-cocomo -i ts,tsx .

# JSON export for CI
scc -f json -i ts,tsx -o metrics.json .

# DRYness analysis
scc -a --no-cocomo -i ts,tsx packages/
```
