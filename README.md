<h1 align="center">User Directory</h1>

# Setup & local development

How to run this User Directory implementation locally.

> **Database:** **PostgreSQL** is used instead of SQLite (same schema ideas, Docker-friendly).  
> The original assignment brief is below.

## Quick start

Requires **Docker** and **Make**.

```bash
git clone https://github.com/23solo/presight-execise.git
cd presight-execise
make up
```

That builds and starts **Postgres**, the **API**, and the **client** as containers. The API container runs migrations and seeds on startup.

| Service | URL |
|---------|-----|
| Client | http://localhost:18080 |
| API | http://localhost:13001 |
| Postgres | `localhost:15432` (user/pass/db: `presight`) |

```bash
make logs    # follow logs
make down    # stop containers (keeps DB volume)
```

### Make targets

| Command | What it does |
|---------|----------------|
| `make up` | Build & start postgres + api + client |
| `make down` | Stop containers (keeps Postgres data) |
| `make logs` | Follow container logs |
| `make build` | Build images only |
| `make help` | List targets |

## Manual Docker commands

Same as `make up`, without Make. Run from the repo root (`presight-execise/`):

```bash
docker compose up --build -d
docker compose logs -f
docker compose down
```

Postgres data is stored in the Docker volume `postgres_data`, so `docker compose down` keeps your DB. To wipe data as well:

```bash
docker compose down -v
```

## Database seeding

Seeding runs automatically inside the API container on start (`docker-entrypoint.sh`), via `presight-assignment-server/src/db/seed.ts`. It skips if users already exist.

Defaults (compose env):

- `SEED_USER_COUNT=5000`
- `SEED_FORCE=false` (set `true` and recreate the API container to wipe + reseed)

Schema lives in `presight-assignment-server/migrations/` (`users`, `hobbies`, `user_hobbies`).

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/users` | Paginated, filtered, sorted users |
| `GET` | `/api/facets` | Top 20 hobbies & nationalities for current filters |
| `GET` | `/api/insights` | Extra directory insights |
| `GET` | `/healthz` | Health check |

---

# Presight Frontend Exercise

Build a small full-stack user directory application. The goal is to evaluate how you design a searchable, filterable, paginated UI backed by persisted data and clear API boundaries.

The application should include:

- A React client.
- A Node.js API server.
- A SQLite database used as the source of truth for user data.
- Docker configuration for running the application locally.

## Scenario

Users need to browse a large directory of people, search by name, and narrow results by nationality and hobbies. The filter sidebar should help users discover useful filters based on the result set they are currently viewing.

## Requirements

### Data Model

Seed a SQLite database with enough records to make pagination, infinite scroll, search, and filter counts meaningful.

Each user should have:

- `avatar`
- `first_name`
- `last_name`
- `age`
- `nationality`
- `hobbies`, from 0 to 10 hobbies per user

Choose a data model that supports the required behavior.

SQLite must be the persisted source of user data.

### API

Expose an API that supports:

- Paginated user results.
- Text filtering from user input across `first_name` and `last_name`.
- Filtering by one or more nationalities.
- Filtering by one or more hobbies.
- Sorting by `first_name`, `last_name`, `age`, and `nationality`.
- Pagination metadata so the client can determine whether more results are available.
- Top 20 hobbies for the active text filter and filter state, including `{ value, count }`.
- Top 20 nationalities for the active text filter and filter state, including `{ value, count }`.

The top 20 values and counts must reflect the currently applied text filter and selected filters, not the global dataset.

Filter semantics:

- Multiple selected hobbies should match users who have all selected hobbies.
- Multiple selected nationalities should match users from any selected nationality.
- Text, hobby, and nationality filters should apply together.

Sorting semantics:

- Sorted results must be deterministic. Use `id` as a final tie-breaker when values are equal.
- Pagination must respect the active sort without duplicate or missing users.

### Client

Build a React interface that includes:

- A text filter input for `first_name` and `last_name`.
- A virtualized, infinitely scrolling list of user cards.
- A sidebar containing the top 20 hobbies and top 20 nationalities for the current result set, including counts.
- Controls for applying and removing hobby and nationality filters.
- Controls for choosing sort field and sort direction.
- Loading, empty, and error states.
- A responsive layout that remains usable on desktop and mobile.

User cards should follow this structure:

```text
|----------------------------------|
| avatar      first_name+last_name |
|             nationality      age |
|                                  |
|             (2 hobbies) (+n)     |
|----------------------------------|
```

Show up to 2 hobbies on the card. If the user has more hobbies, display the remaining count as `+n`.

Use a virtual scroll implementation for the list.

When the text filter or selected filters change, the client must refresh both:

- The paginated user list.
- The top 20 hobbies and nationalities in the sidebar.

The text filter value, selected hobbies, selected nationalities, sort field, and sort direction must be reflected in the URL query string. Reloading or sharing the URL should restore the same view state.

## Implementation Notes

- Keep the database setup easy to run locally.
- Include seed logic or a documented command that creates the SQLite database.
- Include a `Dockerfile` and `docker-compose.yml` that can run the application locally.

## Evaluation Focus

We will pay particular attention to:

- Correct data persistence and API behavior.
- Correct filtering, sorting, pagination, and top 20 counts.
- Smooth infinite scrolling with virtualization.
- URL-synced state.
- Clear loading, empty, and error states.
- Easy local and Docker-based setup.

## Deliverables

Please provide:

- Source code for the React client and Node.js server.
- A `Dockerfile` and `docker-compose.yml`.
- Instructions for setup, database seeding, and running locally.
- Instructions for running with Docker Compose.
