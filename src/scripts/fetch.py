#!/usr/bin/env python3
import json
import subprocess
import hashlib
import sys
from pathlib import Path
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Lightweight HTTP + HTML parsing (always available)
import requests
from lxml import html

# Playwright (import only when needed)
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

CACHE_FILE = Path.home() / ".cache" / "ALI" / "sites.json"
# Lock for Playwright (since it's not thread-safe)
playwright_lock = threading.Lock()

def extract_with_requests(url: str, selector: str) -> str:
    """Fetch and extract using requests + lxml."""
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    }
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    if "Checking your browser" in response.text or "Enable JavaScript" in response.text:
        raise RuntimeError("Cloudflare challenge detected")

    doc = html.fromstring(response.content)
    elements = doc.cssselect(selector)
    if not elements:
        raise ValueError(f"No elements matched selector '{selector}'")
    return elements[0].text_content().strip()

def extract_with_playwright(url: str, selector: str, cookies=None) -> str:
    """Fetch and extract using Playwright (with optional cookies)."""
    if not PLAYWRIGHT_AVAILABLE:
        raise RuntimeError("Playwright not installed. Run: pip install playwright && playwright install firefox")

    # Playwright is not thread-safe; use a lock
    with playwright_lock:
        with sync_playwright() as p:
            browser = p.firefox.launch(headless=True)
            context = browser.new_context()
            if cookies:
                domain = urlparse(url).hostname
                enriched = []
                for c in cookies:
                    enriched.append({
                        "name": c.get("name"),
                        "value": c.get("value"),
                        "domain": domain,
                        "path": c.get("path", "/")
                    })
                context.add_cookies(enriched)

            page = context.new_page()
            page.goto(url, wait_until="networkidle", timeout=20000)

            content = page.content()
            if "Checking your browser" in content:
                browser.close()
                raise RuntimeError("Cloudflare challenge not bypassed")

            try:
                element = page.locator(selector)
                text = element.inner_text()
            except Exception as e:
                browser.close()
                raise ValueError(f"Selector '{selector}' not found: {e}")

            browser.close()
            return text.strip()

def hash_content(content: str) -> str:
    return hashlib.md5(content.encode()).hexdigest()

def send_notification(title: str, message: str, image: str | None = None):
    cmd = ["notify-send", title, message]
    if image and Path(image).exists():
        cmd += ["--icon", image]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def check_site(site):
    """Check a single site. Returns (site, content, used_playwright, error)."""
    title = site["title"]
    url = site["url"]
    selector = site["css_selector"]
    cookies = site.get("cookies")

    print(f"🔍 Checking: {title}")
    content = None
    used_playwright = False
    error = None

    try:
        # Decide method
        use_playwright = bool(cookies) or not PLAYWRIGHT_AVAILABLE

        if not use_playwright:
            try:
                content = extract_with_requests(url, selector)
            except (RuntimeError, requests.RequestException) as e:
                print(f"   ⚠️  {title}: Lightweight fetch failed ({e}), falling back to Playwright")
                use_playwright = True

        if use_playwright:
            print(f"   🧪 {title}: Using Playwright")
            content = extract_with_playwright(url, selector, cookies)
            used_playwright = True

        if not content:
            error = f"Empty content"
        else:
            new_hash = hash_content(content)
            old_hash = site.get("content_hash", "")
            if new_hash != old_hash:
                site["content_hash"] = new_hash
                # Mark whether it's the first run
                site["_first_run"] = (old_hash == "")
                return site, content, used_playwright, None
            else:
                print(f"   ➖ {title}: No change")
                return None, None, False, None

    except Exception as e:
        error = str(e)

    if error:
        print(f"   ❌ {title}: {error}")
    return None, None, False, error

def main():
    if not CACHE_FILE.exists():
        print("📭 No sites to check.")
        return

    with open(CACHE_FILE, "r") as f:
        sites = json.load(f)

    if not sites:
        print("📭 No sites to check.")
        return

    updated_sites = []
    # Run all site checks in parallel (max 10 threads)
    with ThreadPoolExecutor(max_workers=10) as executor:
        # Submit all tasks
        future_to_site = {executor.submit(check_site, site): site for site in sites}

        # Collect results as they complete
        for future in as_completed(future_to_site):
            site, content, used_playwright, error = future.result()
            if site is not None:
                updated_sites.append(site)
                title = site["title"]
                image = site.get("picture_path")
                if site.get("_first_run"):
                    send_notification(
                        title=f"👀 Now watching: {title}",
                        message="Will notify you of future updates.",
                        image=image
                    )
                else:
                    send_notification(
                        title=f"🆕 Update: {title}",
                        message="New content is available!",
                        image=image
                    )
                print(f"   ✅ Updated! (Playwright: {'Yes' if used_playwright else 'No'})")

    if updated_sites:
        # Reload sites to avoid race conditions, then update hashes
        with open(CACHE_FILE, "r") as f:
            sites = json.load(f)
        updated_titles = {s["title"] for s in updated_sites}
        for site in sites:
            if site["title"] in updated_titles:
                new_site = next(s for s in updated_sites if s["title"] == site["title"])
                site["content_hash"] = new_site["content_hash"]
        with open(CACHE_FILE, "w") as f:
            json.dump(sites, f, indent=2)
        print("\n✅ Registry updated with new hashes.")

if __name__ == "__main__":
    main()
