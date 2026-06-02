#!/usr/bin/env python3
"""Generate a jury demo access key and full demo URL for QR codes."""
import secrets
from datetime import datetime, timedelta, timezone

BASE_URL = "https://leakslens.vercel.app"
DAYS = 1


def main() -> None:
    key = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=DAYS)
    expires_str = expires.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    url = f"{BASE_URL}/demo?key={key}"

    print("Add these to your VPS .env (backend), then redeploy:\n")
    print(f"DEMO_ACCESS_KEY={key}")
    print("DEMO_USER_EMAIL=guest1@gmail.com")
    print(f"DEMO_EXPIRES_AT={expires_str}")
    print()
    print("Demo URL (use this for your QR code):\n")
    print(url)
    print()
    print(f"Valid until: {expires_str} UTC ({DAYS} day(s))")
    print("Ensure guest1@gmail.com exists with role 'analyst'.")


if __name__ == "__main__":
    main()
