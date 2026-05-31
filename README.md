## CodeTrack Backend (API)

This folder contains the **CodeTrack** backend – a Node.js/Express + MongoDB API that:

- **Authenticates** students and coordinators using JWT
- Tracks **academic + coding profiles** (LeetCode, CodeChef, HackerRank)
- Integrates the external **LeetCode & CodeChef API**  
  (`https://github.com/coder-writes/leetcode-gfg-codechef-api`)
- Computes **LC/CC/HR scores** and an overall **TOTAL_SCORE**
- Maintains **activity status** (⭐ active / inactive)
- Exposes a shared **leaderboard**
- Generates **resume PDFs** automatically, with optional manual upload

---

### 1. Prerequisites

- Node.js (>= 18 recommended)
- MongoDB running locally or in the cloud
- The external LeetCode & CodeChef API service:
  - Clone `https://github.com/coder-writes/leetcode-gfg-codechef-api`
  - Follow its README
  - Start it on `http://localhost:3000` (or update `PLATFORM_API_BASE_URL`)

---

### 2. Install & Configure

From the `server` folder:

```bash
cd server
npm install
```

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env   # On Windows: copy .env.example .env
```

Update at least:

- `MONGO_URI` – your MongoDB connection string
- `JWT_SECRET` – a strong secret key
- `PLATFORM_API_BASE_URL` – URL where the external API is running

---

### 3. Run the API

Development (auto-reload with nodemon):

```bash
npm run dev
```

Production-style:

```bash
npm start
```

Health check:

```bash
GET http://localhost:5000/api/health
```

You should see:

```json
{ "status": "ok", "message": "CodeTrack API is running" }
```

---

### 4. Key Endpoints (Overview)

**Auth**

- `POST /api/auth/register` – Register (student or coordinator)
- `POST /api/auth/login` – Login, returns JWT with embedded role

**Student (JWT, role = student)**

- `GET /api/student/me` – Get own full profile
- `PUT /api/student/me/profile` – Update academic + coding + HackerRank data
- `POST /api/student/me/sync-platforms` – Sync LeetCode & CodeChef via external API  
  (uses caching to avoid frequent calls)
- `POST /api/student/me/certifications` – Add certification (+ optional PDF/image upload)
- `POST /api/student/me/achievements` – Add achievement
- `POST /api/student/me/hackathons` – Add hackathon (+ optional certificate upload)
- `POST /api/student/me/projects` – Add project (+ optional screenshots)
- `GET /api/student/me/resume` – Auto-generate resume PDF from verified data
- `POST /api/student/me/resume/manual` – Upload manual resume PDF override

**Coordinator (JWT, role = coordinator)**

- `GET /api/coordinator/dashboard` – Totals, active vs inactive, averages, top performers
- `GET /api/coordinator/students` – Filterable/searchable student list
- `GET /api/coordinator/students/:id` – Full read-only student profile

**Leaderboard (shared, any authenticated user)**

- `GET /api/leaderboard` – Ranked table of students  
  Filters: `college`, `hostel`, `branch`, `year`, `name`  
  Sort: `sortBy` (e.g. `scores.totalScore`) and `sortOrder` (`asc` / `desc`)

---

### 5. How External API Is Used

The backend calls the external service (`leetcode-gfg-codechef-api`) only from the server:

- **LeetCode**
  - `GET /leetcode/:username/solved` → `LCPS` (problems solved)
  - `GET /leetcode/:username/contest` → `LCNC` (contest count), `LCR` (rating)

- **CodeChef**
  - `GET /codechef/user/:username/rating` → `CCNC` (total contests), `CCR` (rating)
  - `CCPS` (problems solved) is not exposed by the external API and is treated as `0`

Scoring logic (in `src/utils/scoring.js`):

- `LC_SCORE = LCPS + (LCNC × 5) + (LCR ÷ 10)`
- `CC_SCORE = CCPS + (CCNC × 5) + (CCR ÷ 10)`
- `HR_SCORE` (heuristic): `problemsSolved + badges × 10 + certifications × 15`
- `TOTAL_SCORE = LC_SCORE + CC_SCORE + HR_SCORE`

Scores are computed on the backend and cached on each student record.

---

### 6. Activity Status ⭐

Each student has an `activityStatus` field (`active` / `inactive`), derived from:

- `lastPlatformSyncAt`
- `lastProfileUpdateAt`
- `lastManualActivityAt` (projects, certifications, achievements, hackathons, resume updates)

If the most recent of these timestamps is within `ACTIVITY_ACTIVE_DAYS` (default 7 days),
the student is considered **active** (⭐ glowing); otherwise **inactive** (⭐ faded).

This field is visible in:

- `GET /api/leaderboard`
- Coordinator dashboards and student lists

