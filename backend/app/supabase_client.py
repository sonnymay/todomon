from functools import lru_cache

from supabase import Client, create_client

from .config import get_settings


@lru_cache
def get_supabase() -> Client:
    """Server-side Supabase client.

    Uses the service-role key, which bypasses Row Level Security — keep it
    server-only and never expose it to the browser.
    """
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "Missing Supabase config. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_ROLE_KEY in backend/.env (copy from .env.example)."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
