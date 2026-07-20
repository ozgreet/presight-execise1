# Presight User Directory

A full-stack user directory for browsing, searching, filtering, and sorting a persisted set of
people. The project combines a React client, an Express API, and SQLite, with deterministic
cursor pagination and contextual filter counts designed for infinite scrolling.

## Main features

- Case-insensitive name search across a user's combined first and last name.
- Multi-select hobby filters with AND semantics.
- Multi-select nationality filters with OR semantics.
- Sorting by first name, last name, age, or nationality in either direction.
- Deterministic keyset pagination with an opaque cursor.
- Infinite loading backed by a virtualized list.
- Contextual top-20 hobby and nationality counts.
- URL-synchronized search, filters, sort field, and sort direction.
- Responsive loading, empty, initial-error, and next-page-error states.
- Deterministic generation of 5,000 users in a persisted SQLite database.
- Production-style Docker Compose setup with health checks and a named SQLite volume.

## Technology choices

| Area           | Choice                             | Reason                                                            |
| -------------- | ---------------------------------- | ----------------------------------------------------------------- |
| Client         | React 19, TypeScript, Vite         | Typed component model and fast development/build tooling          |
| Server state   | TanStack Query                     | Caching, request cancellation, and cursor-based infinite queries  |
| Virtualization | TanStack Virtual                   | Keeps the rendered DOM small as loaded pages accumulate           |
| Routing        | React Router                       | URL search parameters are the source of truth for directory state |
| API            | Express 5, TypeScript, Zod         | Small HTTP layer with runtime validation and structured errors    |
| Database       | SQLite, better-sqlite3             | Persisted relational data with a simple local operational model   |
| Monorepo       | Yarn Classic workspaces, Lerna     | Shared install and root-level commands for both packages          |
| Containers     | Docker Compose, Nginx              | Separate production images with one public same-origin endpoint   |
| Testing        | Vitest, Testing Library, Supertest | Unit, component, route, and repository integration coverage       |

SQLite is appropriate for this local exercise because it provides transactions, indexes,
constraints, and persistence without requiring a separate database service. It is not intended
here as a horizontally scaled, multi-writer database.

## Architecture

The repository contains two application packages:

1. The React client owns display state, URL synchronization, debounced search, infinite-query
   orchestration, and list virtualization.
2. The Express server validates requests, constructs parameterized SQLite queries, encodes
   pagination cursors, and returns users or contextual facets.
3. SQLite is the source of truth. Opening the database applies pending migrations. Server
   startup seeds the database only when the `users` table is empty.

Local development uses Vite on `http://localhost:5173`; Vite proxies `/api` to Express on
`http://localhost:3000`.

Docker Compose uses two containers. Nginx serves the built client on
`http://localhost:8080` and proxies `/api` to the private `server:3000` service. This keeps
browser requests same-origin and avoids exposing the API container directly. SQLite is mounted
at `/app/data/presight.sqlite` from a named volume.

## Directory structure

```text
.
├── client
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src
│   │   ├── api
│   │   ├── app
│   │   ├── components
│   │   ├── directory
│   │   ├── hooks
│   │   └── test
│   └── vite.config.ts
├── server
│   ├── Dockerfile
│   └── src
│       ├── db
│       ├── middleware
│       └── users
├── data
├── .dockerignore
├── docker-compose.yml
├── package.json
└── yarn.lock
```

`data/` is created on demand for local SQLite files and is ignored by Git.

## Database

### Schema

The schema has three primary tables:

| Table          | Important columns                                               | Purpose                    |
| -------------- | --------------------------------------------------------------- | -------------------------- |
| `users`        | `id`, `avatar`, `first_name`, `last_name`, `age`, `nationality` | One row per directory user |
| `hobbies`      | `id`, unique case-insensitive `name`                            | Canonical hobby values     |
| `user_hobbies` | `user_id`, `hobby_id`                                           | Composite-key join table   |

`user_hobbies` is a normalized many-to-many relationship because a user can have many hobbies
and each hobby can belong to many users. Normalization prevents repeated hobby strings in user
rows, enforces referential integrity, and supports indexed filtering and aggregation.

Foreign keys use cascading deletes. The schema indexes each supported user sort plus `id`, and
indexes the hobby-to-user lookup. Database triggers enforce at most ten hobbies per user.

SQLite is configured with foreign keys enabled, WAL journaling, and a five-second busy timeout.
Migrations are recorded in `schema_migrations`.

### Creation and seeding

From the repository root, apply migrations without replacing existing rows:

```bash
yarn db:migrate
```

Reset and seed the local database:

```bash
yarn seed
```

The seed is deterministic: seed value `20260719` generates 5,000 users with zero to ten hobbies
each. `yarn seed` replaces user, hobby, and join-table data in the configured database.

The default local path is `data/presight.sqlite`. Starting the API also applies migrations and,
if there are no users, performs the same deterministic seed before it begins listening. Existing
data is not overwritten during normal startup.

### Resetting SQLite

To reset local development data to the deterministic seed:

```bash
yarn seed
```

To reset Docker data, remove the Compose volume and start again:

```bash
docker compose down --volumes
docker compose up --build
```

The second command creates a new volume; API startup migrates and seeds it before the client
starts.

## Query behavior

### Filtering semantics

All filter dimensions combine with AND:

```text
name matches
AND user has every selected hobby
AND nationality is one of the selected nationalities
```

- `q` performs a case-insensitive substring match against
  `first_name + " " + last_name`. SQL wildcard characters from user input are escaped.
- Multiple hobbies use AND semantics. The query selects users whose matched distinct hobby count
  equals the number of requested hobbies, so selecting `Cycling` and `Reading` requires both.
- Multiple nationalities use OR semantics through a case-insensitive `IN` predicate, so selecting
  `Canadian` and `Japanese` accepts either nationality.
- Repeated and comma-separated filter values are both accepted. Empty values are removed and
  duplicates are collapsed case-insensitively.

### Sorting and pagination

The default order is `last_name` ascending. Text sorts are case-insensitive. Every sort appends
`id` in the same direction:

```sql
ORDER BY selected_sort ASC|DESC, id ASC|DESC
```

`id` is unique, so it provides a deterministic tie-breaker when two users share the selected
sort value.

Pagination is keyset-based rather than offset-based. The server requests `limit + 1` rows to
determine `hasMore`, then encodes the last returned sort value, user ID, sort field, direction,
active-filter identity, and cursor version into an opaque base64url cursor. The next request
compares the `(sort value, id)` pair using `>` for ascending order or `<` for descending order. A
cursor is rejected if its filters, sort field, direction, or value type do not match the request.

This avoids offset drift and prevents equal sort values from causing duplicates or omissions
while the underlying result set remains unchanged.

### Contextual facet counts

`GET /api/users/facets` applies the complete active `q`, hobby, and nationality filter state
before grouping values. Each count is the number of distinct users in that already-filtered
result set who have the returned hobby or nationality.

Both facet lists:

- contain at most 20 entries;
- sort by count descending, then value ascending case-insensitively;
- include the active filters from their own dimension;
- are calculated together during one synchronous database transaction.

These are contextual counts, not global totals and not predictive “count if added” values. A
selected value is not forced into the top 20 when it has no matches or ranks below the cutoff.
The client retains selected values from URL state so they can still be removed.

## Client behavior

TanStack Query uses the complete directory state in its cache keys. Search input is trimmed and
debounced by 300 ms; while it is pending, stale requests are not started. Filter or search
changes refresh both the user pages and facets. Sort changes refresh user pages but do not
refetch facets because facet counts are independent of order.

Infinite scrolling and virtualization serve different purposes:

- TanStack Query fetches the next 40-user page when the final virtual item approaches the end.
- TanStack Virtual renders only visible rows plus five overscan rows, even after many pages have
  been loaded.
- Loaded pages are flattened and defensively deduplicated by user ID.
- Changing query state resets the list to the top.

The URL query string is the source of truth for `q`, hobbies, nationalities, sort, and direction.
On first render and browser navigation, the client parses and validates those values, applies
defaults to invalid values, deduplicates and sorts filters, and canonicalizes the URL. Reloading
or sharing the URL therefore restores the same directory state. Default sort values are omitted
from the URL for brevity.

## API

The local API base URL is `http://localhost:3000`. Through Docker, use the public application
origin `http://localhost:8080`; Nginx proxies the same `/api` paths.

### `GET /api/health`

Checks that the API can execute a SQLite statement.

```json
{
  "status": "ok"
}
```

### `GET /api/users`

Returns one page of users.

| Parameter       | Type                      | Default     | Constraints and behavior                                      |
| --------------- | ------------------------- | ----------- | ------------------------------------------------------------- |
| `q`             | string                    | omitted     | Trimmed, maximum 100 characters                               |
| `hobbies`       | string or repeated string | none        | Comma-separated or repeated; maximum 20 values; AND semantics |
| `nationalities` | string or repeated string | none        | Comma-separated or repeated; maximum 20 values; OR semantics  |
| `sort`          | enum                      | `last_name` | `first_name`, `last_name`, `age`, or `nationality`            |
| `direction`     | enum                      | `asc`       | `asc` or `desc`                                               |
| `limit`         | integer                   | `40`        | From 1 through 100                                            |
| `cursor`        | string                    | omitted     | Opaque `nextCursor` from the preceding response               |

Example:

```bash
curl "http://localhost:3000/api/users?hobbies=Reading&sort=age&direction=desc&limit=1"
```

Response from the deterministic seed:

```json
{
  "users": [
    {
      "id": 4363,
      "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=user-4363-Maya-Santos",
      "first_name": "Maya",
      "last_name": "Santos",
      "age": 85,
      "nationality": "Finland",
      "hobbies": [
        "Astronomy",
        "Gardening",
        "Hiking",
        "Photography",
        "Puzzles",
        "Reading",
        "Theater"
      ]
    }
  ],
  "pagination": {
    "limit": 1,
    "hasMore": true,
    "nextCursor": "eyJ2ZXJzaW9uIjoxLCJzb3J0IjoiYWdlIiwiZGlyZWN0aW9uIjoiZGVzYyIsInZhbHVlIjo4NSwiaWQiOjQzNjN9"
  }
}
```

Treat `nextCursor` as opaque.

### `GET /api/users/facets`

Accepts `q`, `hobbies`, and `nationalities` with the same validation and filtering semantics as
the users endpoint. Sorting, page size, and cursor do not affect facets.

Example:

```bash
curl "http://localhost:3000/api/users/facets?q=Maya&hobbies=Reading&nationalities=Finland"
```

Response from the deterministic seed:

```json
{
  "hobbies": [
    { "value": "Astronomy", "count": 1 },
    { "value": "Gardening", "count": 1 },
    { "value": "Hiking", "count": 1 },
    { "value": "Photography", "count": 1 },
    { "value": "Puzzles", "count": 1 },
    { "value": "Reading", "count": 1 },
    { "value": "Theater", "count": 1 }
  ],
  "nationalities": [{ "value": "Finland", "count": 1 }]
}
```

### Errors

Invalid query parameters return HTTP 400 with a stable code, human-readable message, optional
validation details, and a request ID:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "Invalid query parameters",
    "details": [
      {
        "path": "limit",
        "message": "Too big: expected number to be <=100"
      }
    ]
  },
  "requestId": "0d26db2d-caf7-4726-9454-3fae0bb6b15c"
}
```

Malformed or incompatible cursors use code `INVALID_CURSOR`. Unknown routes use `NOT_FOUND`.
Unexpected errors return a generic `INTERNAL_ERROR` response without exposing internals.

## Local development

### Prerequisites

- Node.js 20 or newer.
- Yarn Classic 1.22.22.
- macOS, Linux, or another environment supported by `better-sqlite3`.

Docker is not required for local development.

### Install

From the repository root:

```bash
yarn setup
```

### Environment variables

All settings have development defaults, so environment files are optional.

| Location      | Variable        | Default                   | Purpose                                                |
| ------------- | --------------- | ------------------------- | ------------------------------------------------------ |
| `server/.env` | `PORT`          | `3000`                    | Express listening port                                 |
| `server/.env` | `DATABASE_PATH` | `../data/presight.sqlite` | SQLite path when server scripts run from the workspace |
| `server/.env` | `NODE_ENV`      | `development`             | Validated runtime mode                                 |
| `client/.env` | `VITE_API_URL`  | empty                     | API origin; empty uses Vite’s `/api` proxy             |
| root `.env`   | `APP_PORT`      | `8080`                    | Published Docker client port                           |

The checked-in `.env.example`, `server/.env.example`, and `client/.env.example` files document
these values. Real `.env` files are ignored by Git. No secret values are required by this
application.

### Run client and server

Create or reset the database:

```bash
yarn seed
```

Start both development processes:

```bash
yarn dev
```

Open `http://localhost:5173`. The API is available at `http://localhost:3000`.

### Tests

Run all client and server tests once:

```bash
yarn test
```

Tests use isolated in-memory or temporary SQLite databases and do not depend on the development
database.

### Linting, formatting, and type-checking

```bash
yarn lint
yarn typecheck
yarn format:check
```

To apply formatting:

```bash
yarn format
```

### Production build

Build both workspaces:

```bash
yarn build
```

The client output is written to `client/dist`; the server output is written to `server/dist`.
The root `yarn start` command starts the built API only. The production-style combined
application is provided by Docker Compose, where Nginx serves the client build.

## Docker Compose

### Prerequisites

- Docker Desktop or Docker Engine with Docker Compose v2.
- No host installation of Node.js or Yarn is required.

Build and start the production-style stack:

```bash
docker compose up --build
```

Wait for both health checks, then open `http://localhost:8080`.

The server image uses a multi-stage Node build and runs as the unprivileged `node` user. The
client image builds static Vite assets and serves them with Nginx. Neither container runs a
development watcher.

Both health checks call `/api/health`, which verifies SQLite access; the client check also verifies
the Nginx API proxy. The client waits for the server to become healthy before starting. This
ordering prevents the client from starting before database migration and initial seeding complete.

Stop containers while retaining SQLite data:

```bash
docker compose down
```

Start them again with the retained volume:

```bash
docker compose up --build
```

To publish the application on a different host port:

```bash
APP_PORT=9090 docker compose up --build
```

Open `http://localhost:9090` for that invocation.

## Implementation decisions and trade-offs

- **Keyset pagination over offsets:** stable and efficient for infinite traversal, but cursors are
  coupled to the selected sort and direction and are intentionally opaque.
- **Normalized hobbies:** relational integrity and direct aggregation are preferred over storing
  JSON arrays or duplicated strings. This requires a join when loading and filtering hobbies.
- **Two-step user loading:** the API first pages user rows, then loads hobbies for only those user
  IDs. This avoids row multiplication from joining hobbies into the pagination query.
- **Strict contextual facets:** all active filters, including filters in the facet’s own
  dimension, are applied before counting. This follows the exercise semantics but differs from
  interfaces that show hypothetical counts for adding each option.
- **URL as state:** shareability and reload restoration are prioritized. Canonicalization also
  prevents duplicate or invalid filter values from fragmenting query-cache keys.
- **Debounced search:** a 300 ms delay reduces unnecessary API work while keeping selection and
  sort changes immediate.
- **Virtualized infinite list:** the client may retain fetched pages in memory, but it avoids
  rendering every loaded card into the DOM.
- **Same-origin Docker routing:** Nginx proxies `/api` instead of embedding a container hostname in
  browser code, because Docker service names are not resolvable from the host browser.
- **Seed-on-empty startup:** fresh environments work without a race-prone sidecar initializer,
  while an existing volume is preserved. Explicit `yarn seed` remains intentionally destructive
  for repeatable resets.

## Known limitations

- Name search uses a leading-wildcard SQLite `LIKE` expression. It is correct for this dataset but
  is not a full-text-search strategy for substantially larger directories.
- SQLite and the single API process are intended for local or single-instance deployment, not
  horizontally scaled concurrent writers.
- Seeded avatars are hosted by DiceBear, so displaying them requires network access. User and
  hobby data remain local in SQLite.
- Keyset traversal assumes the matching rows are not being reordered or deleted between page
  requests. The seeded directory is read-only through this API, so that condition holds here.
