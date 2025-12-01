// shourovbot/alihsan/shourova.js
'use strict';

const fs = require('fs');
const path = require('path');

// requires (from this file's location: shourovbot/alihsan)
const login = require('../system/login');                 // shourovbot/system/login
const startUptimeServer = require('../../server/uptime'); // server/uptime (repo root)

// ---------- Paths ----------
const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');   // repo root config.json
const FBSTATE_PATH = path.join(__dirname, '..', '..', 'fbstate.json'); // repo root fbstate.json

// ---------- Load config safely ----------
let config = null;
try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(raw);
  console.log('✓ Config loaded');
} catch (err) {
  console.error('❌ Failed to load config.json:', err.message);
  process.exit(1);
}

// ---------- Robust language loader (JSON or key=value/colon format fallback) ----------
(function loadLanguageSafely() {
  // Determine language code preference (from config.language or fallback to 'en')
  let langCode = 'en';
  try {
    if (config && config.language) {
      langCode = String(config.language).toLowerCase();
    } else if (process.env.LANG_CODE) {
      langCode = String(process.env.LANG_CODE).toLowerCase();
    } else if (process.env.LANG) {
      langCode = String(process.env.LANG).split(/[_\.]/)[0].toLowerCase();
    }
  } catch (e) {
    langCode = 'en';
  }

  // Candidate locations (check alihsan languages first)
  const candidates = [
    path.join(__dirname, 'languages', `${langCode}.lang`),                // shourovbot/alihsan/languages/en.lang
    path.join(__dirname, 'languages', 'en.lang'),
    path.join(__dirname, '..', 'languages', `${langCode}.lang`),         // shourovbot/languages/en.lang
    path.join(__dirname, '..', 'languages', 'en.lang')
  ];

  let found = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) { found = p; break; }
  }

  if (!found) {
    console.error('❌ Failed to load language file: no candidate language files found (checked: ' + candidates.join(', ') + ')');
    throw new Error('Language file not found');
  }

  const raw = fs.readFileSync(found, 'utf8');

  // Try JSON first
  try {
    global.language = JSON.parse(raw);
    console.log('✓ Language loaded (JSON):', path.basename(found));
    return;
  } catch (jsonErr) {
    // fall through to line-based parser
  }

  // Fallback: parse line-based file (ignore lines starting with # or //)
  const result = {};
  const lines = raw.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('//')) continue;
    // handle "key = value" or "key: value"
    const m = line.match(/^([^=:#]+?)\s*(?:=|:)\s*(.+)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim();
      result[key] = val;
    } else {
      // if line contains just "key value", try split by whitespace
      const p = line.split(/\s+/, 2);
      if (p.length === 2) {
        result[p[0]] = p[1];
      }
    }
  }

  if (Object.keys(result).length === 0) {
    console.error('❌ Failed to parse language file (no key=value pairs found):', found);
    throw new Error('Language parse failed');
  }

  global.language = result;
  console.log('✓ Language loaded (key=value fallback):', path.basename(found));
})(); // <-- IIFE closed properly

// ---------- Protection checks ----------
if (!config) {
  console.error('❌ No config loaded — aborting.');
  process.exit(1);
}

if (config.author !== "ALIHSAN SHOUROV") {
  console.error('❌ CRITICAL ERROR: Author protection violated!');
  process.exit(1);
}

if (config.ownerId !== "100071971474157") {
  console.error('❌ CRITICAL ERROR: Owner ID protection violated!');
  process.exit(1);
}

console.log('✓ Author protection: PASSED');
console.log('✓ Owner ID protection: PASSED');
console.log('');

// ---------- Start uptime server (optional, safe) ----------
try {
  if (typeof startUptimeServer === 'function') {
    startUptimeServer(config);
    console.log('✓ Uptime server started (if configured)');
  } else {
    console.warn('⚠️ Uptime module not exported as function; skipping uptime start.');
  }
} catch (err) {
  console.error('❌ Failed to start uptime server:', err.message);
  // do not exit; uptime is optional
}

// ---------- Load fbstate if exists ----------
let appState = null;
try {
  if (fs.existsSync(FBSTATE_PATH)) {
    appState = JSON.parse(fs.readFileSync(FBSTATE_PATH, 'utf8'));
    console.log('✓ Facebook state (fbstate.json) loaded');
  } else {
    console.warn('⚠️ fbstate.json not found — first-time login may require credentials.');
  }
} catch (err) {
  console.error('❌ Error reading fbstate.json:', err.message);
}

// ---------- Start Facebook login & listener ----------
login({ appState }, (err, api) => {
  if (err) {
    console.error('❌ Facebook login error:', err);
    return;
  }

  console.log('✓ Facebook login successful');

  try {
    api.setOptions({
      listenEvents: true,
      selfListen: false,
      updatePresence: true,
      forceLogin: true,
      mqttDisabled: false
    });
  } catch (e) {
    console.warn('⚠️ api.setOptions failed (maybe different API version):', e.message);
  }

  // Save fbstate on login update (optional)
  try {
    if (api.getAppState && typeof api.getAppState === 'function') {
      const newState = api.getAppState();
      fs.writeFileSync(FBSTATE_PATH, JSON.stringify(newState, null, 2), 'utf8');
      console.log('✓ fbstate.json updated');
    }
  } catch (e) {
    // ignore if not supported
  }

  console.log('═══════════════════════════════════════════');
  console.log('🤖 Bot is now online and ready!');
  console.log('═══════════════════════════════════════════');

  // If your system uses event handlers/commands, they can be required/used here.
  if (api.listen) {
    api.listen(async (errListen, event) => {
      if (errListen) {
        console.error('Listen error:', errListen);
        return;
      }

      // Here you can require and call your event/command handlers
      // Example placeholder: attempt to load message handler safely
      try {
        const messageHandlerPath = path.join(__dirname, '..', 'shourov', 'events', 'message.js');
        if (fs.existsSync(messageHandlerPath)) {
          const messageHandler = require(messageHandlerPath);
          if (messageHandler && typeof messageHandler.run === 'function') {
            await messageHandler.run({ event, api, config, language: global.language });
          }
        }
      } catch (err) {
        console.error('Error in message handler:', err);
      }
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Exiting...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Exiting...');
  process.exit(0);
});
