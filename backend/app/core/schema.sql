-- Applied at startup; every statement is idempotent.

-- FUELHH wind output, half-hourly. Actuals can be revised, so writes upsert.
CREATE TABLE IF NOT EXISTS actual_generation (
    start_time     timestamptz PRIMARY KEY,
    generation_mw  integer     NOT NULL
);

-- WINDFOR: many forecasts per target time, one per publish. The primary key doubles as the
-- index for "latest forecast published before a cut-off" (target_time, publish_time DESC).
CREATE TABLE IF NOT EXISTS wind_forecast (
    target_time    timestamptz NOT NULL,
    publish_time   timestamptz NOT NULL,
    generation_mw  integer     NOT NULL,
    PRIMARY KEY (target_time, publish_time)
);

-- Single row recording when data was last loaded.
CREATE TABLE IF NOT EXISTS ingest_meta (
    id           smallint    PRIMARY KEY CHECK (id = 1),
    ingested_at  timestamptz NOT NULL
);
