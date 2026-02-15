const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use('/', express.static(frontendPath));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'MegaPrep Pro Max', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`MegaPrep Pro Max backend running at http://localhost:${PORT}`);
});
