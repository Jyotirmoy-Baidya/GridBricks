import asyncio
from datetime import date
from typing import Any

import httpx

from app.utils.time import day_start

RETRY_STATUS = {429, 500, 502, 503, 504}


class ElexonError(Exception):
    pass


class ElexonClient:
    def __init__(
        self,
        base_url: str,
        *,
        retries: int = 3,
        backoff_s: float = 0.5,
        http: httpx.AsyncClient | None = None,
    ) -> None:
        self._http = http or httpx.AsyncClient(base_url=base_url, timeout=60)
        self._retries = retries
        self._backoff_s = backoff_s

    async def aclose(self) -> None:
        await self._http.aclose()

    async def _get(self, path: str, params: dict[str, str]) -> list[dict[str, Any]]:
        last: Exception | None = None
        for attempt in range(self._retries + 1):
            try:
                resp = await self._http.get(path, params=params)
                if resp.status_code in RETRY_STATUS:
                    raise ElexonError(f"{path} returned {resp.status_code}")
                resp.raise_for_status()
                data = resp.json()
                if not isinstance(data, list):
                    raise ElexonError(f"{path} returned unexpected payload")
                return data
            except (httpx.TransportError, ElexonError) as exc:
                last = exc
                if attempt < self._retries:
                    await asyncio.sleep(self._backoff_s * 2**attempt)
        raise ElexonError(f"{path} failed after {self._retries + 1} attempts: {last}")

    async def fetch_actuals(self, start: date, end: date) -> list[dict[str, Any]]:
        """FUELHH wind rows with settlement dates in [start, end]."""
        return await self._get(
            "/datasets/FUELHH/stream",
            {
                "settlementDateFrom": start.isoformat(),
                "settlementDateTo": end.isoformat(),
                "fuelType": "WIND",
            },
        )

    async def fetch_forecasts(self, start: date, end: date) -> list[dict[str, Any]]:
        """WINDFOR rows published in [start 00:00Z, end 00:00Z]."""
        return await self._get(
            "/datasets/WINDFOR/stream",
            {"publishDateTimeFrom": day_start(start), "publishDateTimeTo": day_start(end)},
        )
