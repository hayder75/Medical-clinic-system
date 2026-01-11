const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.FRONTEND_PORT || 3001;

// Get the absolute path to frontend/dist
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

// Serve static files from dist directory with no-cache headers
app.use(express.static(frontendDistPath, {
  setHeaders: (res, path) => {
    // Disable caching for HTML files
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Cache assets but with revalidation
    if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  }
}));

// Handle React Router - all routes serve index.html
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving files from: ${frontendDistPath}`);
});

