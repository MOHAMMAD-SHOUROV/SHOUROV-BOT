const express = require('express');
const path = require('path');

module.exports = function startUptimeServer(config = {}) {
  const app = express();

  // Public folder serve
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Show index.html (your Nayan webpage)
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: "online",
      bot: config.botName || "SHOUROV-BOT",
      prefix: config.prefix || "/",
      time: Date.now()
    });
  });

  const port = process.env.PORT || config.port || 3000;

  app.listen(port, () => {
    console.log(`🌐 Web server running at http://localhost:${port}`);
  });
};
