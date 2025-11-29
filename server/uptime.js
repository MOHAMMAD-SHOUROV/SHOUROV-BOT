// server/uptime.js
const express = require('express');

function startUptimeServer(config = {}) {
  const app = express();

  // Safe defaults in case fields missing
  const botName = config.botName || 'SHOUROV-BOT';
  const prefix = config.prefix || '/';
  const author = config.author || 'ALIHSAN SHOUROV';
  const port = parseInt(process.env.PORT, 10) || config.port || 3000;

  // Prevent multiple listeners if startUptimeServer called more than once
  if (app.listening) {
    console.log('Uptime server already started (skipping duplicate start).');
    return app._server || app;
  }

  const startTime = Date.now();

  app.get('/', (req, res) => {
    const uptimeMs = Date.now() - startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    res.send(`
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>${botName}</title>
          <style>
            body { font-family: Arial, sans-serif; background: linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#fff; display:flex;justify-content:center;align-items:center;height:100vh;margin:0; }
            .container { text-align:center; background: rgba(255,255,255,0.08); padding:28px; border-radius:16px; backdrop-filter: blur(6px); max-width:520px; }
            h1 { margin:0 0 10px 0; font-size:2rem; }
            .info { margin:8px 0; font-size:1rem; }
            .status { color:#4ade80; font-weight:700; }
            @media (max-width:480px) { .container { padding:18px; } h1 { font-size:1.3rem; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 ${botName}</h1>
            <div class="info">Prefix: <strong>${prefix}</strong></div>
            <div class="info">Author: <strong>${author}</strong></div>
            <div class="info">Status: <span class="status">ONLINE ✓</span></div>
            <div class="info">Uptime: <strong>${hours}h ${minutes}m ${seconds}s</strong></div>
            <div class="info" style="margin-top:12px;opacity:0.85;font-size:0.9rem;">Facebook Messenger Bot | Render Deployment Ready</div>
          </div>
        </body>
      </html>
    `);
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      botName,
      uptime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
  });

  // Start server and handle errors
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`✓ Uptime server started on port ${port}`);
  });

  server.on('error', (err) => {
    console.error('Uptime server error:', err);
  });

  // Mark that we've started to prevent duplicate listen calls
  app.listening = true;
  app._server = server;

  // Optional: graceful shutdown helpers
  const shutdown = (signal) => {
    console.log(`Received ${signal}. Closing uptime server...`);
    if (server && server.close) {
      server.close(() => {
        console.log('Uptime server closed.');
        // don't exit the whole process here; let main app decide
      });
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

module.exports = startUptimeServer;
