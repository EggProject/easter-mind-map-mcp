---
paths:
  - "**/*.{ts,tsx}"
---

# ast-grep (`sg`) — Structural Code Search & Refactoring

**Path**: `ast-grep` (v0.40.5), alias: `sg`

ALWAYS use for TypeScript/TSX structural code operations instead of text-based grep.

## When to Use
- **ast-grep**: structural patterns, safe refactoring, AST-aware search (skips comments/strings)
- **ripgrep/Grep tool**: simple text/identifier search, quick content checks

## Syntax
- **Search**: `ast-grep run -p '<pattern>' -l tsx`
- **Replace**: `ast-grep run -p '<pattern>' -r '<replacement>' -l tsx -U`
- **Metavariables**: `$VAR` (one node), `$_` (anonymous), `$$$ARGS` (variadic)

## Examples
```bash
# Find all useState calls
ast-grep run -p 'useState($INIT)' -l tsx

# Find console.log statements
ast-grep run -p 'console.log($$$)' -l tsx

# Find JSX with specific prop
ast-grep run -p '<Button variant=$VAL $$$>' -l tsx

# Find scoped package imports
ast-grep run -p 'import { $$$NAMES } from "@easter-desktop/$_"' -l tsx

# Replace pattern
ast-grep run -p 'console.log($$$ARGS)' -r 'logger.debug($$$ARGS)' -l tsx -U
```

## Config
No project config yet (no `sgconfig.yml`) — CLI-only mode.
