#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Create an absolute-URL sitemap and advertise it in robots.txt."""

import json
import os
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

ROOT = Path(__file__).resolve().parent
PAGES = (
    ("", "1.0", "daily"),
    ("jokes.html", "0.9", "weekly"),
    ("greetings.html", "0.9", "weekly"),
    ("games.html", "0.7", "monthly"),
)


def main() -> int:
    if len(sys.argv) > 2:
        print("Usage: python generate_sitemap.py [https://your-public-domain.example]", file=sys.stderr)
        return 2

    base_url = (sys.argv[1] if len(sys.argv) == 2 else os.environ.get("SITE_URL", "")).strip().rstrip("/")
    if not base_url:
        print("SITE_URL is missing. Set it to the deployed Cloudflare Pages HTTPS URL.", file=sys.stderr)
        return 2

    parsed = urlparse(base_url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        print("Provide the deployed site's HTTPS origin only, e.g. https://example.com", file=sys.stderr)
        return 2

    today = date.today().isoformat()
    data_file = ROOT / "data.json"
    try:
        data = json.loads(data_file.read_text(encoding="utf-8"))
        last_updated = data.get("last_updated", "")
        if last_updated:
            today = datetime.fromisoformat(last_updated.replace("Z", "+00:00")).date().isoformat()
    except (OSError, json.JSONDecodeError, ValueError, TypeError):
        pass

    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    root = Element("urlset", xmlns=namespace)
    for path, priority, change_frequency in PAGES:
        entry = SubElement(root, "url")
        SubElement(entry, "loc").text = f"{base_url}/{path}" if path else f"{base_url}/"
        SubElement(entry, "lastmod").text = today
        SubElement(entry, "changefreq").text = change_frequency
        SubElement(entry, "priority").text = priority

    xml = minidom.parseString(tostring(root, encoding="utf-8")).toprettyxml(indent="  ", encoding="UTF-8")
    sitemap_path = ROOT / "sitemap.xml"
    sitemap_path.write_bytes(xml)

    robots_path = ROOT / "robots.txt"
    robots_lines = robots_path.read_text(encoding="utf-8").splitlines() if robots_path.exists() else ["User-agent: *", "Allow: /"]
    robots_lines = [line for line in robots_lines if not line.strip().lower().startswith("sitemap:")]
    robots_lines.append(f"Sitemap: {base_url}/sitemap.xml")
    robots_path.write_text("\n".join(robots_lines) + "\n", encoding="utf-8")

    print(f"Created sitemap.xml for {base_url} (lastmod {today}) and updated robots.txt")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
