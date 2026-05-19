#!/usr/bin/env python3
"""E-mail scraper: crawlt een of meer websites en haalt e-mailadressen op.

Gebruik:
    python3 email_scraper.py https://example.com
    python3 email_scraper.py -i urls.txt -o emails.csv --depth 3 --workers 8
    python3 email_scraper.py https://a.com https://b.com --max-pages 500

Belangrijk (juridisch): gebruik dit alleen op sites die je mag scrapen.
Het verzamelen van e-mailadressen voor ongevraagde mail is in de EU onder
de AVG en e-Privacy-regels in veel gevallen niet toegestaan. Respecteer
robots.txt en de voorwaarden van de site.
"""
from __future__ import annotations

import argparse
import csv
import re
import sys
import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urldefrag, urljoin, urlparse
from urllib.robotparser import RobotFileParser

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit(
        "Ontbrekende packages. Installeer met:\n"
        "    pip install -r tools/requirements.txt"
    )

# E-mailpatroon. Vangt ook eenvoudige obfuscaties ([at]/(at)/ [dot] ) op.
EMAIL_RE = re.compile(
    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
)
OBFUSCATED_RE = re.compile(
    r"([a-zA-Z0-9._%+\-]+)\s*(?:\[at\]|\(at\)|\s+at\s+)\s*"
    r"([a-zA-Z0-9.\-]+)\s*(?:\[dot\]|\(dot\)|\s+dot\s+)\s*([a-zA-Z]{2,})",
    re.IGNORECASE,
)

# Bestandsextensies die we niet downloaden (binaries / media).
SKIP_EXT = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
    ".zip", ".rar", ".gz", ".tar", ".mp4", ".mp3", ".avi", ".mov",
    ".css", ".js", ".woff", ".woff2", ".ttf", ".eot", ".doc", ".docx",
    ".xls", ".xlsx", ".ppt", ".pptx",
)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; EmailScraper/1.0; "
        "+https://example.invalid/bot)"
    )
}


class Crawler:
    def __init__(
        self,
        seeds: list[str],
        depth: int,
        max_pages: int,
        workers: int,
        same_domain: bool,
        delay: float,
        respect_robots: bool,
        timeout: float,
    ) -> None:
        self.depth = depth
        self.max_pages = max_pages
        self.workers = workers
        self.same_domain = same_domain
        self.delay = delay
        self.respect_robots = respect_robots
        self.timeout = timeout

        self.session = requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)

        self.lock = threading.Lock()
        self.seen_urls: set[str] = set()
        self.emails: dict[str, str] = {}  # email -> eerste bron-URL
        self.pages_done = 0
        self._robots: dict[str, RobotFileParser] = {}

        self.queue: deque[tuple[str, int]] = deque()
        for s in seeds:
            self._enqueue(s, 0)

        self.allowed_domains = {
            self._registrable(urlparse(s).netloc) for s in seeds
        }

    # -- helpers -----------------------------------------------------------
    @staticmethod
    def _registrable(netloc: str) -> str:
        host = netloc.split(":")[0].lower()
        if host.startswith("www."):
            host = host[4:]
        return host

    def _enqueue(self, url: str, d: int) -> None:
        url, _ = urldefrag(url)
        with self.lock:
            if url in self.seen_urls:
                return
            self.seen_urls.add(url)
            self.queue.append((url, d))

    def _robots_ok(self, url: str) -> bool:
        if not self.respect_robots:
            return True
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        rp = self._robots.get(base)
        if rp is None:
            rp = RobotFileParser()
            rp.set_url(urljoin(base, "/robots.txt"))
            try:
                rp.read()
            except Exception:
                rp = None  # robots niet leesbaar -> toestaan
            self._robots[base] = rp
        if rp is None:
            return True
        return rp.can_fetch(DEFAULT_HEADERS["User-Agent"], url)

    def _in_scope(self, url: str) -> bool:
        p = urlparse(url)
        if p.scheme not in ("http", "https"):
            return False
        if url.lower().endswith(SKIP_EXT):
            return False
        if self.same_domain:
            return self._registrable(p.netloc) in self.allowed_domains
        return True

    # -- core --------------------------------------------------------------
    def _extract_emails(self, text: str, source: str) -> None:
        found = set(EMAIL_RE.findall(text))
        for m in OBFUSCATED_RE.finditer(text):
            found.add(f"{m.group(1)}@{m.group(2)}.{m.group(3)}")
        with self.lock:
            for e in found:
                e = e.strip().strip(".").lower()
                if e.lower().endswith(SKIP_EXT):
                    continue
                self.emails.setdefault(e, source)

    def _process(self, url: str, d: int) -> list[tuple[str, int]]:
        if not self._robots_ok(url):
            return []
        try:
            r = self.session.get(
                url, timeout=self.timeout, allow_redirects=True
            )
        except requests.RequestException:
            return []
        ctype = r.headers.get("Content-Type", "")
        if "html" not in ctype and "text" not in ctype:
            return []

        self._extract_emails(r.text, url)

        if d >= self.depth:
            return []

        children: list[tuple[str, int]] = []
        try:
            soup = BeautifulSoup(r.text, "html.parser")
        except Exception:
            return []
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.startswith(("mailto:", "tel:", "javascript:")):
                if href.startswith("mailto:"):
                    self._extract_emails(href[7:], url)
                continue
            nxt = urljoin(url, href)
            if self._in_scope(nxt):
                children.append((nxt, d + 1))
        return children

    def run(self) -> None:
        with ThreadPoolExecutor(max_workers=self.workers) as pool:
            while True:
                with self.lock:
                    if self.pages_done >= self.max_pages or not self.queue:
                        if not self.queue:
                            break
                    batch = []
                    while self.queue and len(batch) < self.workers:
                        if self.pages_done >= self.max_pages:
                            break
                        batch.append(self.queue.popleft())
                        self.pages_done += 1
                if not batch:
                    break

                futures = [
                    pool.submit(self._process, u, d) for u, d in batch
                ]
                for f in futures:
                    for child_url, child_d in f.result():
                        self._enqueue(child_url, child_d)

                done = self.pages_done
                print(
                    f"\r  pagina's: {done}  |  e-mails: {len(self.emails)}",
                    end="",
                    file=sys.stderr,
                    flush=True,
                )
                if self.delay:
                    time.sleep(self.delay)
        print(file=sys.stderr)


def load_seeds(args: argparse.Namespace) -> list[str]:
    seeds: list[str] = list(args.urls)
    if args.input:
        with open(args.input, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line and not line.startswith("#"):
                    seeds.append(line)
    norm: list[str] = []
    for s in seeds:
        if not s.startswith(("http://", "https://")):
            s = "https://" + s
        norm.append(s)
    if not norm:
        sys.exit("Geen URL's opgegeven. Geef een URL of gebruik -i bestand.")
    return norm


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Crawlt websites en verzamelt e-mailadressen."
    )
    ap.add_argument("urls", nargs="*", help="Een of meer start-URL's")
    ap.add_argument(
        "-i", "--input", help="Tekstbestand met een URL per regel"
    )
    ap.add_argument(
        "-o", "--output", default="emails.csv", help="CSV-uitvoerbestand"
    )
    ap.add_argument(
        "--depth", type=int, default=2,
        help="Hoe diep links volgen (0 = alleen startpagina). Standaard 2",
    )
    ap.add_argument(
        "--max-pages", type=int, default=500,
        help="Max. aantal pagina's totaal. Standaard 500",
    )
    ap.add_argument(
        "--workers", type=int, default=8,
        help="Aantal parallelle downloads. Standaard 8",
    )
    ap.add_argument(
        "--all-domains", action="store_true",
        help="Ook externe domeinen volgen (standaard: alleen startdomein)",
    )
    ap.add_argument(
        "--delay", type=float, default=0.0,
        help="Pauze (sec) tussen batches. Wees beleefd voor de server",
    )
    ap.add_argument(
        "--no-robots", action="store_true",
        help="robots.txt negeren (afgeraden)",
    )
    ap.add_argument(
        "--timeout", type=float, default=15.0,
        help="Time-out per request in seconden. Standaard 15",
    )
    args = ap.parse_args()

    seeds = load_seeds(args)
    print(
        f"Start: {len(seeds)} seed(s), depth={args.depth}, "
        f"max_pages={args.max_pages}, workers={args.workers}",
        file=sys.stderr,
    )

    crawler = Crawler(
        seeds=seeds,
        depth=args.depth,
        max_pages=args.max_pages,
        workers=args.workers,
        same_domain=not args.all_domains,
        delay=args.delay,
        respect_robots=not args.no_robots,
        timeout=args.timeout,
    )
    crawler.run()

    rows = sorted(crawler.emails.items())
    with open(args.output, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["email", "source_url"])
        w.writerows(rows)

    print(
        f"Klaar. {len(rows)} unieke e-mailadressen -> {args.output}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
