const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use('/', express.static(frontendPath));

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ omrSubmissions: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'MegaPrep Pro Max', time: new Date().toISOString() });
});

app.get('/api/omr-submissions', (_req, res) => {
  const db = readDb();
  res.json(db.omrSubmissions || []);
});

app.post('/api/omr-submissions', (req, res) => {
  const { roll, setCode, score, total, answers, time } = req.body || {};
  if (!roll || !setCode) {
    return res.status(400).json({ ok: false, message: 'roll and setCode are required' });
  }

  const db = readDb();
  const record = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    roll,
    setCode,
    score: Number(score || 0),
    total: Number(total || 0),
    answers: Array.isArray(answers) ? answers : [],
    time: time || new Date().toLocaleString()
  };

  db.omrSubmissions = db.omrSubmissions || [];
  db.omrSubmissions.unshift(record);
  db.omrSubmissions = db.omrSubmissions.slice(0, 1000);
  writeDb(db);
  return res.json({ ok: true, record });
});

app.listen(PORT, () => {
  ensureDb();
  console.log(`MegaPrep Pro Max backend running at http://localhost:${PORT}`);
});
