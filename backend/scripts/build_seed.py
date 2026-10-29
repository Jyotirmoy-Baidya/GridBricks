"""Build data/seed.json.gz straight from Elexon (no Redis needed).

Usage: python -m scripts.build_seed --from 2025-12-30 --to 2026-02-01
"""

import argparse
import asyncio
from datetime import date, timedelta

from app.core.config import get_settings
from app.services.cleaning import clean_actuals, clean_forecasts
from app.services.elexon_client import ElexonClient
from app.services.ingestion_service import windows
from app.services.seed_service import SEED_PATH, write_seed


async def main(start: date, end: date) -> None:
    settings = get_settings()
    client = ElexonClient(settings.elexon_base_url)
    try:
        actuals, forecasts = [], []
        for a, b in windows(start, end):
            actuals += clean_actuals(await client.fetch_actuals(a, b))
            raw = await client.fetch_forecasts(a, b + timedelta(days=1))
            forecasts += clean_forecasts(raw, settings.ingest_horizon_h)
        actuals = sorted(dict(actuals).items())
        forecasts = sorted((t, p, mw) for (t, p), mw in {(t, p): mw for t, p, mw in forecasts}.items())
    finally:
        await client.aclose()
    write_seed(SEED_PATH, actuals, forecasts)
    print(f"wrote {SEED_PATH}: {len(actuals)} actuals, {len(forecasts)} forecasts")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--from", dest="start", type=date.fromisoformat, default=date(2025, 12, 30))
    p.add_argument("--to", dest="end", type=date.fromisoformat, default=date.today())
    args = p.parse_args()
    asyncio.run(main(args.start, args.end))
