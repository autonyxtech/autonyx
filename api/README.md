# API database

Lead submissions and website visit counts use the SQLAlchemy models in `app/db/models.py`.
Set `DATABASE_URL` in the API environment to the Neon PostgreSQL connection URL. Keep the
URL in `api/.env` locally and in the deployment provider's secret environment variables;
never commit it. Without `DATABASE_URL`, local development uses the SQLite file configured
by `LEADS_DATABASE_PATH`.

Install the API dependencies from this directory:

```powershell
python -m pip install -r requirements.txt
```

Apply the current schema to the configured database:

```powershell
alembic upgrade head
```

Create a migration after changing the models, review the generated migration, then apply it:

```powershell
alembic revision --autogenerate -m "describe the schema change"
alembic upgrade head
```

Other useful commands are `alembic current`, `alembic history`, and `alembic downgrade -1`.
Run Alembic from the `api` directory so it loads this folder's `alembic.ini` and `.env`.
