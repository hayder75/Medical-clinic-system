const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.FRONTEND_PORT || 3001;
const distPath = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
});
