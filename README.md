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

Health check endpoint:

- `GET /api/health`

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

