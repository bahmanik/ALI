import json
import shutil
import hashlib
from pathlib import Path
from .models import BASE_DIR, SITES_FILE, ASSETS_DIR

def add_site(
    title: str,
    url: str,
    css_selector: str,
    picture_location: str | None = None,
    cookies: str | None = None,  # Accepts JSON string
) -> None:
    """
    Add a new tracked site to the registry.

    Args:
        title: Human-readable title
        url: Target URL to monitor
        css_selector: CSS selector to extract content
        picture_location: Path to cover image (optional)
        cookies: JSON string of cookies (optional)
    """
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    ASSETS_DIR.mkdir(exist_ok=True)

    url = url.strip()
    url_hash = hashlib.sha256(url.encode()).hexdigest()[:12]

    # Handle image
    if picture_location is not None:
        src_image = Path(picture_location).expanduser().resolve()
        if not src_image.is_file():
            raise FileNotFoundError(f"Source image not found: {src_image}")
        ext = src_image.suffix or ".png"
        asset_name = f"{url_hash}{ext}"
        cached_image_path = ASSETS_DIR / asset_name
        shutil.copy2(src_image, cached_image_path)
        picture_path_str = str(cached_image_path)
    else:
        picture_path_str = None

    cache_path = BASE_DIR / "cache" / f"{url_hash}.txt"
    cache_path.parent.mkdir(parents=True, exist_ok=True)

    # Parse cookies if provided
    cookies_list = None
    if cookies is not None:
        try:
            parsed = json.loads(cookies)
            if isinstance(parsed, list):
                cookies_list = parsed
            else:
                raise ValueError("Cookies must be a JSON array")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid cookies JSON: {e}")

    site_entry = {
        "title": title,
        "url": url,
        "css_selector": css_selector,
        "picture_path": picture_path_str,
        "cache_path": str(cache_path),
        "cookies": cookies_list,  # May be None or list
    }

    # Load and dedupe
    if SITES_FILE.exists():
        with open(SITES_FILE, "r") as f:
            sites = json.load(f)
    else:
        sites = []

    if any(s["title"] == title for s in sites):
        raise ValueError(f"Title already in use: '{title}'")

    sites.append(site_entry)

    with open(SITES_FILE, "w") as f:
        json.dump(sites, f, indent=2)

    print(f"✅ Added site: {title}")
    print(f"   URL:    {url}")
    if picture_location is not None:
        print(f"   Image:  {cached_image_path}")
    else:
        print("   Image:  (none)")
    if cookies_list is not None:
        print("   Cookies: ✔️")
    else:
        print("   Cookies: (none)")
    print(f"   Cache:  {cache_path}")

def list_sites() -> None:
    if not SITES_FILE.exists():
        print("📭 No sites tracked yet.")
        return

    with open(SITES_FILE, "r") as f:
        sites = json.load(f)

    if not sites:
        print("📭 No sites tracked.")
        return

    print(f"📋 Tracked sites ({len(sites)}):")
    print("-" * 60)
    for i, site in enumerate(sites, 1):
        print(f"{i}. {site['title']}")
        print(f"   URL:    {site['url']}")
        print(f"   Selector: {site['css_selector']}")
        print(f"   Image:  {site['picture_path']}")
        print(f"   Cache:  {site['cache_path']}")
        has_cookies = "✔️" if site.get("cookies") else "(none)"
        print(f"   Cookies: {has_cookies}")
        print()

def update_site(
    title: str,
    url: str | None = None,
    css_selector: str | None = None,
    picture_location: str | None = None,
    cookies: str | None = None,
) -> None:
    if not SITES_FILE.exists():
        raise FileNotFoundError("No sites tracked yet.")

    with open(SITES_FILE, "r") as f:
        sites = json.load(f)

    target = None
    for site in sites:
        if site["title"] == title:
            target = site
            break

    if target is None:
        raise ValueError(f"No site found with title: '{title}'")

    # Update URL
    if url is not None:
        target["url"] = url.strip()
        new_hash = hashlib.sha256(target["url"].encode()).hexdigest()[:12]
        old_path = Path(target["picture_path"]) if target["picture_path"] else None
        if old_path and old_path.exists():
            new_ext = old_path.suffix or ".png"
            new_path = ASSETS_DIR / f"{new_hash}{new_ext}"
            old_path.rename(new_path)
            target["picture_path"] = str(new_path)

    if css_selector is not None:
        target["css_selector"] = css_selector

    if picture_location is not None:
        src_image = Path(picture_location).expanduser().resolve()
        if not src_image.is_file():
            raise FileNotFoundError(f"New image not found: {src_image}")

        old_image_path = target["picture_path"]
        if old_image_path is not None:
            old_image = Path(old_image_path)
            if old_image.exists():
                old_image.unlink()

        current_hash = hashlib.sha256(target["url"].encode()).hexdigest()[:12]
        ext = src_image.suffix or ".png"
        new_asset_name = f"{current_hash}{ext}"
        new_image_path = ASSETS_DIR / new_asset_name
        shutil.copy2(src_image, new_image_path)
        target["picture_path"] = str(new_image_path)

    # Update cookies
    if cookies is not None:
        try:
            parsed = json.loads(cookies)
            if isinstance(parsed, list):
                target["cookies"] = parsed
            else:
                raise ValueError("Cookies must be a JSON array")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid cookies JSON: {e}")

    with open(SITES_FILE, "w") as f:
        json.dump(sites, f, indent=2)

    print(f"✅ Updated site: {title}")
    if url: print(f"   New URL: {url}")
    if css_selector: print(f"   New selector: {css_selector}")
    if picture_location: print(f"   New image: {target['picture_path']}")
    if cookies is not None: print("   Cookies: ✔️")

def remove_site(title: str) -> None:
    """Remove a tracked site and all its cached assets."""
    if not SITES_FILE.exists():
        raise FileNotFoundError("No sites tracked yet.")

    with open(SITES_FILE, "r") as f:
        sites = json.load(f)

    target = None
    for i, site in enumerate(sites):
        if site["title"] == title:
            target = site
            sites.pop(i)
            break

    if target is None:
        raise ValueError(f"No site found with title: '{title}'")

    # Always remove assets (skip if None)
    for path_key in ("picture_path", "cache_path"):
        path_str = target[path_key]
        if path_str is not None:
            path = Path(path_str)
            if path.exists():
                path.unlink()
    with open(SITES_FILE, "w") as f:
        json.dump(sites, f, indent=2)

    print(f"✅ Removed site and assets: {title}")
