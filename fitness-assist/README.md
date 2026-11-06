# Fitness Assist

A full-stack fitness platform that puts workout planning, nutrition tracking and progress analytics in one place.

- **Workouts**: exercise library (by muscle group and equipment), reusable routines, live set/rep/weight logging with automatic volume per exercise and per session.
- **Nutrition**: daily food log, macro tracking, and remaining calories in real time. Targets come from the user's profile and goal (fat loss, muscle gain, maintenance).
- **Progress**: body weight and circumference history, strength trends (best set and estimated 1RM), weekly training volume.
- **Admin dashboard**: coaches see every trainee's activity and progress, add or delete trainees, suspend accounts, reset passwords, keep private coach notes, and export the list as CSV. See [Admin dashboard](#admin-dashboard).
- **Background jobs**: a midnight job issues each user a fresh daily calorie allowance; a Monday job builds the weekly consistency summary.

## Stack

| Layer | Technology |
|---|---|
| Language / framework | Java 17, Spring Boot 3.3 |
| Auth | Spring Security + JWT (jjwt) |
| Persistence | Spring Data JPA, Hibernate, MySQL 8 |
| API docs | Swagger / OpenAPI (springdoc) |
| Build | Maven |
| Frontend | React 18 (Vite), Tailwind CSS, Recharts |
| API testing | Postman collection in `postman/` |

## Project layout

```
fitness-assist/
  backend/    Spring Boot API (com.fitnessassist: controller, service, repository, model, dto, security, scheduler)
  frontend/   React + Tailwind app
  postman/    Postman collection
  docker-compose.yml   MySQL for local development
```

## Run it locally

You need JDK 17+ and Node 18+. Maven is not required: the backend ships a Maven
wrapper (`backend/mvnw`) that downloads Maven on first use.

For the database, use an existing MySQL 8 or the bundled Docker one.

### 1. Local configuration

```bash
cd backend/config
cp application.yml.example application.yml    # then set your MySQL password
```

Spring Boot loads `backend/config/application.yml` automatically whenever the
backend is started from the `backend` folder, so `mvnw spring-boot:run`,
`java -jar`, and your IDE's run button all pick it up with no extra flags. The
file is gitignored, so your password stays out of the repository.

Without it, the backend falls back to the defaults in
`src/main/resources/application.yml`, which assume the MySQL password is
`root` -- that is the usual cause of `Access denied for user 'root'@'localhost'`
at startup.

### 2. Database

**An existing MySQL 8** -- put its URL, user and password in
`backend/config/application.yml`. The `fitness_assist` database is created on
first connect.

**Docker instead** -- `docker compose up -d`. The container publishes port
**3307** by default, because 3306 is usually taken by a locally installed
MySQL, so use that port in your config:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3307/fitness_assist?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

Override the published port with `MYSQL_PORT` if you prefer another one.

### 3. Start both halves

On Windows (PowerShell), from the `fitness-assist` folder, in two terminals:

```powershell
.\run-backend.ps1     # http://localhost:8080
.\run-frontend.ps1    # http://localhost:5173
```

Or by hand, on any platform:

```bash
cd backend && ./mvnw spring-boot:run          # backend
cd frontend && npm install && npm run dev     # frontend
```

Both routes read the same `backend/config/application.yml`. Environment
variables still override it if you prefer that for CI or deployment.

- Swagger UI: http://localhost:8080/swagger-ui.html (use **Authorize** and paste the token from `/api/auth/login`)
- Tables are created by Hibernate (`ddl-auto: update`), and the exercise library (about 40 exercises) is seeded automatically.
- The frontend dev server proxies `/api` to the backend, so no CORS setup is needed in development.

### Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | local MySQL, db `fitness_assist` | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / `root` | database login |
| `JWT_SECRET` | development value | **change this**; at least 32 characters |
| `APP_TIMEZONE` | `Asia/Kolkata` | what "today" means for logs and scheduled jobs |
| `CORS_ORIGINS` | `http://localhost:5173` | comma-separated allowed origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@fitnessassist.com` / `Admin@12345` | first admin account, created on startup if none exists; **change the password** outside local development |
| `ADMIN_NAME` | `Head Coach` | display name of that admin |

Run the unit tests with `mvn test` (they cover the calorie/macro calculator and need no database).

## API overview

All routes except `/api/auth/**` need `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Profile | `GET/PUT /api/profile` (changing goal or body stats recalculates targets) |
| Exercises | `GET /api/exercises?muscleGroup=&equipment=&q=`, `GET /api/exercises/{id}`, `GET /api/exercises/meta` |
| Routines | `GET/POST /api/routines`, `GET/PUT/DELETE /api/routines/{id}` |
| Workouts | `POST /api/workouts/sessions`, `POST /api/workouts/sessions/{id}/sets`, `DELETE .../sets/{setId}`, `POST .../finish`, `GET /api/workouts/sessions[/{id}]`, `DELETE .../{id}` |
| Nutrition | `GET /api/nutrition/daily?date=`, `POST /api/nutrition/food-logs`, `DELETE /api/nutrition/food-logs/{id}` |
| Body metrics | `GET /api/metrics?from=&to=`, `POST /api/metrics` (one entry per day, re-posting updates it), `DELETE /api/metrics/{id}` |
| Progress | `GET /api/progress/weight?days=`, `GET /api/progress/strength/{exerciseId}`, `GET /api/progress/volume?weeks=` |
| Weekly summaries | `GET /api/summaries/weekly`, `POST /api/summaries/weekly/generate?date=` |
| Admin (ADMIN role only) | `GET /api/admin/overview`, `GET/POST /api/admin/trainees`, `GET/DELETE /api/admin/trainees/{id}`, `PUT /api/admin/trainees/{id}/status`, `PUT .../password`, `PUT .../notes` |
| Admin database (ADMIN only) | `GET /api/admin/data` (tables, columns, row counts), `GET /api/admin/data/{table}?page=&size=&q=&sort=&dir=&<column>=<value>`, `GET /api/admin/data/{table}/options?q=`, `GET/PUT/DELETE /api/admin/data/{table}/{id}`, `POST /api/admin/data/{table}` |

## Admin dashboard

Log in with the admin account (see `ADMIN_EMAIL` / `ADMIN_PASSWORD` above) and you land on `/admin` instead of the trainee dashboard.

- **Overview** (`/admin`): trainee count, how many were active in the last 7 days, workouts and volume this week, the share of trainees hitting their weekly workout target, weekly workout and sign-up charts, a goal breakdown, a top-5 leaderboard, and a "needs a check-in" list of trainees with no activity for 7+ days.
- **Trainees** (`/admin/trainees`): searchable, filterable, sortable table with status, this week's workouts against target, total workouts, weight change, consistency score and last activity. Add a trainee (with a generated temporary password), suspend or reactivate, delete, or export the filtered rows to CSV.
- **Trainee detail** (`/admin/trainees/{id}`): profile and targets, weight trend chart, last 10 workouts, weekly summaries, private coach notes, and reset-password / suspend / delete actions.

- **Database** (`/admin/data`): full create / read / update / delete for every table — users, exercises, routines, routine exercises, workout sessions, workout sets, food logs, daily targets, body metrics and weekly summaries. Search, filter (click any linked value such as a user to filter by it), sort by any column, page through rows, and open "Related records" from a row to jump to everything that references it. Writes go through the same rules as the app: passwords are hashed, calorie/macro targets are recalculated when a user's profile changes, set volume and session totals are recomputed, and an admin cannot delete, demote or deactivate their own account. Duplicate values and deletes blocked by references come back as a clear message instead of an error page. Table definitions live in `service/data/DataResources.java`; add an entity there to expose it.

Status meanings: **Active** = trained or logged food in the last 7 days; **New** = joined in the last 7 days with nothing logged; **Inactive** = nothing for 7+ days; **Suspended** = blocked by an admin (cannot log in, existing sessions stop working, data is kept). Deleting a trainee removes all of their data permanently. Admin accounts cannot be suspended or deleted from the dashboard.

## How the calculations work

- **Calorie target**: Mifflin-St Jeor BMR x activity multiplier, then -500 kcal (fat loss), +300 kcal (muscle gain) or 0 (maintenance), with a 1,200 kcal floor.
- **Macros**: protein 2.0 g/kg (fat loss, muscle gain) or 1.6 g/kg (maintenance); fat is 25% of calories; carbs fill the rest.
- **Volume**: reps x weight per set, summed per exercise and per session.
- **Estimated 1RM**: Epley formula, `weight x (1 + reps/30)`.
- **Consistency score (0-100)**: 50 points for hitting the weekly workout target (default 4, editable in Profile) plus 50 points for days with food logged (7 of 7 = full marks).

## Scheduled jobs

| Job | Schedule (in `APP_TIMEZONE`) | What it does |
|---|---|---|
| Daily calorie reset | every day 00:00 | creates the day's calorie/macro allowance for every user |
| Weekly consistency summary | Mondays 05:00 | summarises the previous Monday-Sunday week |

Both are also safe to trigger lazily: opening the nutrition page creates the day's allowance if the job hasn't run, and the Progress page can generate the current week's summary on demand.

## Notes for production

- Set a strong `JWT_SECRET` and a real database password; switch `ddl-auto` from `update` to a migration tool such as Flyway.
- Tokens last 24 hours (`app.jwt.expiration-ms`) and are stored in the browser's localStorage in this version.
- If you run more than one backend instance, the scheduled jobs will run on each; add a lock (for example ShedLock) first.
