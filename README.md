# MegaPrep Pro Max – AI Exam & Coaching Management System

MegaPrep Pro Max is a premium, beginner-friendly exam and coaching management web application with a **single-file version** and an **optional modular full-project version**.

## Features

- Demo login with premium dashboard UX
- Question Bank (MCQ + Written) with:
  - Add / Edit / Delete
  - MathJax support (`\( ... \)`)
  - Optional image upload (base64)
  - Search/filter and question counter
  - Import/Export JSON
  - LocalStorage autosave
- Exam Generator:
  - 1–4 sets (A/B/C/D)
  - Shuffle questions and options
  - Correct-answer remapping retained
  - A4-styled preview with answer keys
- PDF Export with `html2pdf.js`:
  - Scale 3
  - A4 format
  - MathJax render before export
  - File name: `MegaPrep_Exam.pdf`
- Dashboard Analytics using Chart.js
- Student Exam Mode:
  - Timer + random MCQ exam
  - Auto submit on timer end
  - Auto score and result history
- OMR System + OMR Checking:
  - Text-based OMR sheet generator by set
  - Auto OMR checker against generated set answer key
  - OMR submission database (LocalStorage + backend API)
- Professional extras:
  - Reset confirmation modal
  - Loading overlay
  - Form validation and error handling

---

## Project Structure

```text
Megatest-1/
├─ index.html                     # Single HTML production app (works standalone)
├─ README.md
└─ modular/
   ├─ frontend/
   │  ├─ index.html               # Modular frontend entry
   │  ├─ styles.css               # Extracted styles
   │  └─ app.js                   # Extracted app logic
   └─ backend/
      ├─ package.json             # Optional Node/Express backend
      └─ server.js                # Static serving + health API
```

---

## Quick Start (Single HTML Version)

1. Open `index.html` directly in your browser.
2. Login with demo credentials:
   - Username: `admin`
   - Password: `admin123`
   - (Any non-empty username/password also works in demo mode.)
3. Start using:
   - Question Bank
   - Exam Generator
   - PDF export
   - Student Exam mode

> Data is persisted in browser LocalStorage.

---

## Modular Version Setup (Optional)

### Option A: Frontend only (static)

Use any static server in `modular/frontend`:

```bash
cd modular/frontend
python -m http.server 5500
```

Then open `http://localhost:5500`.

### Option B: Node.js + Express backend

```bash
cd modular/backend
npm install
npm start
```

Open `http://localhost:4000`.

Health check endpoints:

- `GET /api/health`
- `GET /api/omr-submissions`
- `POST /api/omr-submissions`

---

## How to Run Locally

### Single-file production mode

- Double-click `index.html`, or
- Serve via static server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

### Notes

- Internet is needed for CDN libraries (Chart.js, MathJax, html2pdf.js, Google Fonts).
- For full offline use, download those libraries and host locally.

---

## Deployment

### GitHub Pages

1. Push repository to GitHub.
2. Go to **Settings → Pages**.
3. Set source to your main branch root.
4. Save.
5. GitHub Pages will publish `index.html` as your live app.

### Vercel

1. Import this repo into Vercel.
2. Framework preset: **Other**.
3. Build command: *(none)*.
4. Output directory: `.`
5. Deploy.

For modular version on Vercel with backend APIs, deploy as a Node project and set start command from `modular/backend`.

---

## Suggested Production Upgrades

- Add authentication and role-based access (JWT / sessions)
- Replace LocalStorage with MongoDB/PostgreSQL
- Add audit logs and backups
- Add AI-assisted question generation workflow
- Add secure image storage and file upload service


---

## Make It More Professional (Recommended Checklist)

To make this production-grade for coaching businesses:

1. **Authentication & Roles**
   - Add role-based users (`super_admin`, `teacher`, `operator`, `viewer`)
   - Enforce session expiry and audit login history

2. **Data Reliability**
   - Move all core entities (questions, exams, OMR, results) to database tables
   - Add automatic daily backups + export snapshots

3. **OMR at Scale**
   - Add bulk OMR upload (CSV/API)
   - Add negative marking config, merit list generation, percentile analytics

4. **Observability**
   - Add server logs + error tracking (Sentry/Logtail)
   - Add request tracing for API failures

5. **Security**
   - Add rate limiting, CORS policy, input sanitation
   - Add CSRF protection for admin panels

---

## Cloudflare Database Setup (Detailed)

If you want cloud-hosted DB using Cloudflare, use **Cloudflare D1 + Workers**.

### Architecture
- Frontend (this app) → calls Worker API
- Worker API → reads/writes Cloudflare D1
- Optional: static frontend on Cloudflare Pages

### 1) Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2) Create D1 database

```bash
wrangler d1 create megaprep-db
```

Copy the returned `database_id`.

### 3) Create schema

Create `schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS omr_submissions (
  id TEXT PRIMARY KEY,
  roll TEXT NOT NULL,
  set_code TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_omr_roll ON omr_submissions(roll);
CREATE INDEX IF NOT EXISTS idx_omr_submitted_at ON omr_submissions(submitted_at);
```

Apply schema:

```bash
wrangler d1 execute megaprep-db --file=./schema.sql
```

### 4) Create Worker API

`wrangler.toml` example:

```toml
name = "megaprep-api"
main = "src/worker.js"
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DB"
database_name = "megaprep-db"
database_id = "<PUT_DATABASE_ID_HERE>"
```

`src/worker.js` minimal API:

```js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/api/omr-submissions') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM omr_submissions ORDER BY submitted_at DESC LIMIT 500'
      ).all();
      return Response.json(results);
    }

    if (req.method === 'POST' && url.pathname === '/api/omr-submissions') {
      const body = await req.json();
      const id = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO omr_submissions
         (id, roll, set_code, score, total, answers_json, submitted_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      ).bind(
        id,
        body.roll,
        body.setCode,
        Number(body.score || 0),
        Number(body.total || 0),
        JSON.stringify(body.answers || []),
        body.time || new Date().toISOString()
      ).run();

      return Response.json({ ok: true, id });
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

Deploy:

```bash
wrangler deploy
```

### 5) Point frontend to Cloudflare API

In production, set your frontend to call your Worker domain, for example:

- `https://megaprep-api.<your-subdomain>.workers.dev/api/omr-submissions`

If you keep same-origin hosting (Pages + Worker routes), existing `/api/...` calls can continue unchanged.

### 6) (Optional) Cloudflare Pages + Worker routing

- Host `modular/frontend` on Cloudflare Pages
- Attach Worker to same domain routes `/api/*`
- This gives a clean setup:
  - UI: `https://app.example.com`
  - API: `https://app.example.com/api/...`

