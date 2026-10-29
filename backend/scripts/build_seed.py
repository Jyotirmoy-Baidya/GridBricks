"""Build data/seed.json.gz straight from Elexon (no Redis needed).

Usage: python -m scripts.build_seed --from 2025-12-30 --to 2026-02-01
"""

import argparse
import asyncio
from datetime import date

from app.core.config import get_settings
from app.services.cleaning import clean_actuals, clean_forecasts
from app.services.elexon_client import ElexonClient
from app.services.seed_service import SEED_PATH, write_seed


async def main(start: date, end: date) -> None:
    settings = get_settings()
    client = ElexonClient(settings.elexon_base_url)
    try:
        actuals = clean_actuals(await client.fetch_actuals(start, end))
        forecasts = clean_forecasts(await client.fetch_forecasts(start, end), settings.ingest_horizon_h)
    finally:
        await client.aclose()
    write_seed(SEED_PATH, actuals, forecasts)
    print(f"wrote {SEED_PATH}: {len(actuals)} actuals, {len(forecasts)} forecasts")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--from", dest="start", type=date.fromisoformat, default=date(2025, 12, 30))
    p.add_argument("--to", dest="end", type=date.fromisoformat, default=date(2026, 2, 1))
    args = p.parse_args()
    asyncio.run(main(args.start, args.end))
