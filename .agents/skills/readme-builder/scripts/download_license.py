#!/usr/bin/env python3
"""
download_license.py — fetch the canonical, SPDX-accurate license text
from GitHub's official license API and write it to `LICENSE` in the
current directory.

This is the primary license-fetching script for the `readme-builder`
skill. It is the only supported way to obtain a LICENSE file — never
hand-type a license; every popular open-source license has a specific
canonical text and paraphrasing is a real legal risk.

Usage:
    python3 download_license.py --spdx MIT --year 2026 --name "Jane Developer"
    python3 download_license.py --spdx Apache-2.0 --year 2026 --name "Acme Corp"

GitHub API reference:
    GET https://api.github.com/licenses/{spdx-id}
    Response: JSON with `body` (the full license text with
    [year] / [fullname] placeholders), `spdx_id`, `name`, etc.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import urllib.error
import urllib.request

GITHUB_LICENSE_API = "https://api.github.com/licenses/{spdx_id}"

# Spdx id → shields.io badge color. Picked for visual consistency
# with the rest of the readme-builder skill.
SPDX_BADGE_COLORS = {
    "MIT": "yellow",
    "Apache-2.0": "blue",
    "GPL-3.0": "blue",
    "BSD-3-Clause": "blue",
    "BSD-2-Clause": "blue",
    "ISC": "blue",
    "MPL-2.0": "blue",
    "Unlicense": "blue",
    "LGPL-3.0": "blue",
    "LGPL-2.1": "blue",
    "AGPL-3.0": "blue",
    "CC0-1.0": "lightgrey",
    "WTFPL": "red",
    "OFL-1.1": "blue",
    "EPL-2.0": "blue",
    "0BSD": "blue",
}


def fetch_license(spdx_id: str) -> dict:
    """Fetch the canonical license JSON from GitHub's license API.

    Raises urllib.error.HTTPError on 404 / 5xx.
    Raises urllib.error.URLError on DNS / connection failures.
    Returns the parsed JSON dict.
    """
    url = GITHUB_LICENSE_API.format(spdx_id=spdx_id)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "readme-builder-skill/1.0",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def substitute_placeholders(body: str, year: int, name: str) -> str:
    """Replace [year] and [fullname] placeholders in the license body.

    GitHub's license API returns the canonical text with these
    placeholders so the caller can fill in their own values. Some
    licenses use [year of copyright] and [name of copyright owner]
    instead — handle those too.
    """
    body = body.replace("[year]", str(year))
    body = body.replace("[yyyy]", str(year))
    body = body.replace("[year of copyright]", str(year))
    body = body.replace("[fullname]", name)
    body = body.replace("[name of copyright owner]", name)
    body = body.replace("[name of copyright holder]", name)
    body = body.replace("[copyright holder]", name)
    body = body.replace("[owner]", name)
    return body


def write_license_file(path: str, body: str) -> None:
    """Write the license body to `path` (LICENSE by default).

    Writes atomically via a temp file to avoid leaving a half-written
    file on disk if the script is interrupted.
    """
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as fp:
        fp.write(body)
        if not body.endswith("\n"):
            fp.write("\n")
    os.replace(tmp, path)


def write_license_meta(
    path: str,
    spdx_id: str,
    year: int,
    name: str,
    api_url: str,
) -> None:
    """Write the .license-meta.json sidecar with the metadata needed
    by the README-authoring phase (badge color, copyright line, etc.).
    """
    meta = {
        "spdx_id": spdx_id,
        "year": year,
        "copyright_holder": name,
        "downloaded_at": dt.datetime.now(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "source_url": api_url,
        "badge_color": SPDX_BADGE_COLORS.get(spdx_id, "blue"),
    }
    with open(path, "w", encoding="utf-8") as fp:
        json.dump(meta, fp, indent=2, ensure_ascii=False)
        fp.write("\n")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Download the canonical, SPDX-accurate license text from "
            "GitHub's license API and write it to LICENSE."
        ),
    )
    parser.add_argument(
        "--spdx",
        required=True,
        help="SPDX license identifier (e.g. MIT, Apache-2.0, GPL-3.0).",
    )
    parser.add_argument(
        "--year",
        type=int,
        default=dt.date.today().year,
        help="Copyright year (default: current year).",
    )
    parser.add_argument(
        "--name",
        required=True,
        help='Copyright holder name (e.g. "Jane Developer" or "Acme Corp").',
    )
    parser.add_argument(
        "--out",
        default="LICENSE",
        help="Output path for the license file (default: ./LICENSE).",
    )
    parser.add_argument(
        "--meta-out",
        default=".license-meta.json",
        help="Output path for the metadata sidecar (default: ./.license-meta.json).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the first 20 lines of the license without writing any file.",
    )
    args = parser.parse_args(argv)

    try:
        data = fetch_license(args.spdx)
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            print(
                f"ERROR: SPDX id '{args.spdx}' is not a known license on "
                f"GitHub's license API. Check the spelling or pick from "
                f"the menu (MIT, Apache-2.0, GPL-3.0, BSD-3-Clause).",
                file=sys.stderr,
            )
            return 2
        print(
            f"ERROR: GitHub license API returned HTTP {exc.code}: {exc.reason}",
            file=sys.stderr,
        )
        return 1
    except urllib.error.URLError as exc:
        print(
            f"ERROR: Could not reach api.github.com ({exc.reason}). "
            f"The skill cannot download a license without network access. "
            f"Two options: run on a machine with internet, or paste the "
            f"canonical license text yourself.",
            file=sys.stderr,
        )
        return 1

    body = substitute_placeholders(data["body"], args.year, args.name)

    if args.dry_run:
        print(f"--- LICENSE preview ({args.spdx}, {args.year}, {args.name}) ---")
        for line in body.splitlines()[:20]:
            print(line)
        print("--- end preview ---")
        return 0

    write_license_file(args.out, body)
    write_license_meta(
        args.meta_out,
        args.spdx,
        args.year,
        args.name,
        data.get("url", GITHUB_LICENSE_API.format(spdx_id=args.spdx)),
    )

    print(f"✓ Wrote {args.out} ({args.spdx}, {args.year}, {args.name})")
    print(f"✓ Wrote {args.meta_out} (sidecar with badge color and metadata)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
