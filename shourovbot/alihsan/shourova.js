// index.js
const fs = require('fs');
const path = require('path');
const express = require('express'); // kept for completeness (uptime uses express)
const login = require('./system/login'); 
const startUptimeServer = require('./server/uptime'); // uptime server module

// ---------- Paths ----------
const CONFIG_PATH = path.join(__dirname, 'config.json');
const FBSTATE_PATH = path.join(__dirname, 'fbstate.json');
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

// ---------- Load language (must happen AFTER config is available) ----------
try {
  const langFile = config.language || 'en';
  const langPath = path.join(__dirname, 'shourov', 'catalogs', 'languages', `${langFile}.lang`);
  if (!fs.existsSync(langPath)) {
    throw new Error(`Language file not found: ${langPath}`);
  }
  global.language = JSON.parse(fs.readFileSync(langPath, 'utf8'));
  console.log(`✓ Language loaded: ${langFile}`);
} catch (err) {
  console.error('❌ Failed to load language file:', err.message);
  // আপনি চাইলে এখানে default রাখতে পারেন; কিন্তু এখন exit করা safer
  process.exit(1);
}

// ---------- Protection checks (as you had) ----------
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
  // don't exit; login may still work with credentials
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

  // options (adjust per your fb-chat-api version)
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

  // Listener
  api.listen(async (errListen, event) => {
    if (errListen) {
      console.error('Listen error:', errListen);
      return;
    }

    // Run event handlers
    for (const eventHandler of events) {
      try {
        await eventHandler.run({ event, api, config, commands });
      } catch (error) {
        console.error(`Error in event ${eventHandler.name || 'unknown'}:`, error);
      }
    }

    // Message handling (message handler module path — adjust if needed)
    if (event.type === 'message' || event.type === 'message_reply') {
      try {
        const messageHandlerPath = path.join(__dirname, 'shourov', 'events', 'message.js');
        // fallback: if project uses different path, adjust above
        const messageHandler = require(messageHandlerPath);
        await messageHandler.run({ event, api, config, commands, language: global.language });
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  });
});

// ---------- Graceful shutdown ----------
process.on('SIGINT', () => {
  console.log('Received SIGINT. Exiting...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Exiting...');
  process.exit(0);
});
