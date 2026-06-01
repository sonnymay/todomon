# ToDoMon Backend (FastAPI)

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

## Run

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Health check: http://localhost:8000/health
- Interactive docs: http://localhost:8000/docs

## Notes

- Uses the Supabase **service-role** key (full DB access, bypasses RLS). Server-only — never expose it to the frontend.
- The frontend uses the **anon** key instead.
