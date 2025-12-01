// index.js (fixed)
const fs = require('fs');
const path = require('path');
const express = require('express'); // kept for completeness (uptime uses express)

// requires from repository root
const login = require('../system/login');
const startUptimeServer = require('../../server/uptime'); // uptime server module

// ---------- Paths (root-based) ----------
const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');
const FBSTATE_PATH = path.join(__dirname, '..', '..', 'fbstate.json');
const COMMANDS_DIR = path.join(__dirname, 'shourov', 'commands');
const EVENTS_DIR = path.join(__dirname, 'shourov', 'events');

// ---------- Load config safely ----------
let config;
try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(raw);
  console.log('✓ Config loaded');
} catch (err) {
  console.error('❌ Failed to load config.json:', err.message);
  process.exit(1);
}


(function loadLanguageSafely() {
  // Determine language code preference (from config.language or fallback to 'en')
  let langCode = 'en';
  try {
    if (typeof config !== 'undefined' && config && config.language) {
      langCode = String(config.language).toLowerCase();
    } else if (process.env.LANG_CODE) {
      langCode = String(process.env.LANG_CODE).toLowerCase();
    } else if (process.env.LANG) {
      langCode = String(process.env.LANG).split(/[_\.]/)[0].toLowerCase();
    }
  } catch (e) {
    langCode = 'en';
  }

  // Candidate locations (check alihsan languages first since your folder is there)
  const candidates = [
    path.join(__dirname, 'languages', `${langCode}.lang`),                // shourovbot/alihsan/languages/en.lang
    path.join(__dirname, 'languages', 'en.lang'),                       // fallback in same dir
    path.join(__dirname, '..', 'languages', `${langCode}.lang`),        // shourovbot/languages/en.lang
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
      // if line contains just "key value", try split first whitespace
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
}

// ---------- Protection checks ----------
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

// ---------- Start uptime server ----------
try {
  startUptimeServer(config);
} catch (err) {
  console.error('❌ Failed to start uptime server:', err.message);
  // continue running bot even if uptime fails (optional)
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

// ---------- Helper: loadCommands & loadEvents ----------
function loadCommands(dir = COMMANDS_DIR) {
  const commands = new Map();
  try {
    if (!fs.existsSync(dir)) {
      console.warn('⚠️ Commands directory not found:', dir);
      return commands;
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const cmdPath = path.join(dir, file);
        const cmd = require(cmdPath);
        if (cmd && cmd.name) commands.set(cmd.name, cmd);
      } catch (e) {
        console.error('Error loading command', file, e);
      }
    }
  } catch (e) {
    console.error('Error reading commands directory:', e);
  }
  return commands;
}

function loadEvents(dir = EVENTS_DIR) {
  const events = [];
  try {
    if (!fs.existsSync(dir)) {
      console.warn('⚠️ Events directory not found:', dir);
      return events;
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const evPath = path.join(dir, file);
        const ev = require(evPath);
        if (ev && typeof ev.run === 'function') events.push(ev);
      } catch (e) {
        console.error('Error loading event', file, e);
      }
    }
  } catch (e) {
    console.error('Error reading events directory:', e);
  }
  return events;
}

// ---------- Initialize command/event containers ----------
const commands = loadCommands();
const events = loadEvents();

console.log(`✓ Loaded ${commands.size} commands`);
console.log(`✓ Loaded ${events.length} events`);
console.log('🤖 Bot starting...');

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

  try {
    if (api.getAppState && typeof api.getAppState === 'function') {
      const newState = api.getAppState();
      fs.writeFileSync(FBSTATE_PATH, JSON.stringify(newState, null, 2), 'utf8');
      console.log('✓ fbstate.json updated');
    }
  } catch (e) {}

  console.log('═══════════════════════════════════════════');
  console.log('🤖 Bot is now online and ready!');
  console.log('═══════════════════════════════════════════');

  api.listen(async (errListen, event) => {
    if (errListen) {
      console.error('Listen error:', errListen);
      return;
    }

    for (const eventHandler of events) {
      try {
        await eventHandler.run({ event, api, config, commands });
      } catch (error) {
        console.error(`Error in event ${eventHandler.name || 'unknown'}:`, error);
      }
    }

    if (event.type === 'message' || event.type === 'message_reply') {
      try {
        const messageHandlerPath = path.join(__dirname, 'shourov', 'events', 'message.js');
        const messageHandler = require(messageHandlerPath);
        await messageHandler.run({ event, api, config, commands, language: global.language });
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  });
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
