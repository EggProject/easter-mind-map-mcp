---
paths:
  - "**/*.{ts,tsx}"
---

# sd — Modern sed Replacement

**Path**: `sd` (v1.0.0)

ALWAYS use `sd` instead of `sed` for find-and-replace operations.

## Why sd over sed
- JS/Python regex syntax (no escape confusion)
- Separate arguments for find/replace (no delimiter issues)
- Capture groups: `$1`, `$2` (not `\1`, `\2`)
- In-place modification by default
- 2-11x faster (Rust)

## Key Flags
| Flag | Purpose |
|------|---------|
| `-p` | Preview changes without writing |
| `-F` | Fixed strings (no regex) |
| `-f i` | Case-insensitive |
| `-f w` | Whole word match |
| `-n N` | Limit to N replacements per file |
| `-A` | Match across line boundaries |

## Examples
```bash
# Basic replace
sd 'oldPattern' 'newPattern' file.ts

# Preview before applying
sd -p 'const ' 'let ' app.tsx

# Literal string (no regex)
sd -F 'special(chars)' 'literal' file.txt

# Regex with capture groups
sd '(\w+)Service' '$1Provider' src/**/*.ts

# Whole word replace
sd -f w 'any' 'unknown' src/**/*.ts

# Stdin processing
git diff | sd 'old' 'new'
```
