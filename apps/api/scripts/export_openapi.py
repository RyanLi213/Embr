"""Write the API's OPENAPI specifications to a file, for generating the typed web client."""

import json
from pathlib import Path

from embr_api.main import app

# Repo root is three folders up from this file: scripts -> api -> apps -> root
OUTPUT = Path(__file__).resolve().parents[3] / "packages" / "api-client" / "openapi.json"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
    print(f"Wrote: {OUTPUT}")


if __name__ == "__main__":
    main()
