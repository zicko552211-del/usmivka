#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Create an absolute-URL sitemap for the deployed static site."""

import sys
from datetime import date
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
    if len(sys.argv) != 2:
        print("Usage: python generate_sitemap.py https://your-public-domain.example", file=sys.stderr)
        return 2

    base_url = sys.argv[1].strip().rstrip("/")
    parsed = urlparse(base_url)
    if parsed.scheme != "https" or not parsed.netloc or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
        print("Provide the deployed site's HTTPS origin only, e.g. https://example.com", file=sys.stderr)
        return 2

    today = date.today().isoformat()
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    root = Element("urlset", xmlns=namespace)
    for path, priority, change_frequency in PAGES:
        entry = SubElement(root, "url")
        SubElement(entry, "loc").text = f"{base_url}/{path}" if path else f"{base_url}/"
        SubElement(entry, "lastmod").text = today
        SubElement(entry, "changefreq").text = change_frequency
        SubElement(entry, "priority").text = priority

    xml = minidom.parseString(tostring(root, encoding="utf-8")).toprettyxml(indent="  ", encoding="UTF-8")
    (ROOT / "sitemap.xml").write_bytes(xml)
    print(f"Created sitemap.xml for {base_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
