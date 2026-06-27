---
paths:
  - "**/*.{yaml,json,toml}"
---

# yq — YAML/JSON/TOML Processor

**Path**: `yq` (v4.52.4, mikefarah/yq Go variant)

Use for reading/modifying structured config files (YAML, JSON, TOML, XML).

## Key Flags
| Flag | Purpose |
|------|---------|
| `-i` | Modify file in-place |
| `-n` | Create output without input |
| `-o format` | Output format (yaml, json, toml, xml, csv) |
| `-P` | Pretty print |
| `-e` | Set exit code on no match |

## Examples
```bash
# Read a JSON value
yq '.compilerOptions.target' tsconfig.json

# Modify in-place
yq -i '.version = "1.0.1"' package.json

# List workspace packages
yq '.workspaces[]' package.json

# Convert JSON to YAML
yq -P -o yaml turbo.json

# Extract dependency names
yq '.dependencies | keys' package.json

# Create from scratch
yq -n '.name = "new-package" | .version = "0.1.0"'

# Chain operations
yq -i '.a = "x" | .b = "y"' config.yaml
```
