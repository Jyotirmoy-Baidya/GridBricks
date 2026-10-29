from app.core.db import clean_dsn, direct_url, uses_pooler

NEON = "postgresql://u:p@ep-x-pooler.c-8.us-east-1.aws.neon.tech/db?sslmode=require&channel_binding=require"


def test_clean_dsn_drops_channel_binding_only():
    assert clean_dsn(NEON).endswith("/db?sslmode=require")


def test_pooler_detected_and_direct_host_derived():
    assert uses_pooler(NEON)
    assert "-pooler" not in direct_url(NEON)
    assert direct_url(NEON).startswith("postgresql://u:p@ep-x.c-8")
    assert not uses_pooler("postgresql://windmon:windmon@localhost:5433/windmon")
