import argparse
from .core import add_site, update_site, remove_site, list_sites

def main():
    parser = argparse.ArgumentParser(
        prog="tracker",
        description="Manage tracked websites for AGS notifications"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # List
    subparsers.add_parser("list", help="List all tracked sites")

    # Add
    add_parser = subparsers.add_parser("add", help="Add a new site")
    add_parser.add_argument("--title", required=True, help="Human-readable title")
    add_parser.add_argument("--url", required=True, help="URL to monitor")
    add_parser.add_argument("--selector", required=True, help="CSS selector to extract content")
    add_parser.add_argument("--image", help="Path to cover image")
    add_parser.add_argument("--cookies", help="JSON with cookies (for login-required sites)")

    # Update
    update_parser = subparsers.add_parser("update", help="Update an existing site")
    update_parser.add_argument("--title", required=True, help="Title of the site to update")
    update_parser.add_argument("--url", help="New URL")
    update_parser.add_argument("--selector", help="New CSS selector")
    update_parser.add_argument("--image", help="Path to new cover image")
    update_parser.add_argument("--cookies", help="new cookies JSON")

    # Remove
    remove_parser = subparsers.add_parser("remove", help="Remove a site")
    remove_parser.add_argument("--title", required=True, help="Title of the site to remove")

    args = parser.parse_args()

    try:
        if args.command == "list":
            list_sites()
        elif args.command == "add":
            add_site(
                title=args.title,
                url=args.url,
                css_selector=args.selector,
                picture_location=args.image,
                cookies=args.cookies
            )
        elif args.command == "update":
            if not any([args.url, args.selector, args.image, args.cookies]):
                parser.error("At least one of --url, --selector, --image, or --cookies must be provided")
            update_site(
                title=args.title,
                url=args.url,
                css_selector=args.selector,
                picture_location=args.image,
                cookies=args.cookies
            )
        elif args.command == "remove":
            remove_site(args.title)
    except (ValueError, FileNotFoundError) as e:
        print(f"❌ Error: {e}")
        exit(1)
