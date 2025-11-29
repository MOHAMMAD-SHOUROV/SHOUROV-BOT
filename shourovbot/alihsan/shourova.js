// index.js
const fs = require('fs');
const path = require('path');
// login module (local - project likely has this)
const login = require('./shourovbot/system/login');
// express only used by uptime server (kept for completeness)
const express = require('express');

// Paths
const CONFIG_PATH = path.join(__dirname, 'config.json');
const FBSTATE_PATH = path.join(__dirname, 'fbstate.json');
const COMMANDS_DIR = path.join(__dirname, 'commands');       // adjust if commands live elsewhere
const EVENTS_DIR = path.join(__dirname, 'events');           // adjust if events live elsewhere

// --- Load config safely ---
let config;
try {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(raw);
  console.log('✓ Loaded config.json');
} catch (err) {
  console.error('❌ Failed to load config.json:', err.message);
  process.exit(1);
}

// Start uptime server (serves public/ and provides /health)
const startUptimeServer = require('./server/uptime');
startUptimeServer(config);

console.log('═══════════════════════════════════════════');
console.log('   SHOUROV-BOT - Facebook Messenger Bot   ');
console.log('═══════════════════════════════════════════');

// Protection checks (keep author's protection)
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

// ----------------- Simple loaders -----------------
// These are minimal loaders. If you already have loaders, replace these with yours.

function loadCommands(dir = COMMANDS_DIR) {
  const commands = new Map();

  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Commands directory not found: ${dir} — returning empty commands map`);
    return commands;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    // support nested folders if needed
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      // recursively load js files in subfolders
      const subFiles = fs.readdirSync(full);
      for (const sf of subFiles) {
        if (!sf.endsWith('.js')) continue;
        try {
          const cmd = require(path.join(full, sf));
          if (cmd && cmd.name) commands.set(cmd.name, cmd);
        } catch (e) {
          console.error(`Failed loading command ${sf}:`, e);
        }
      }
      continue;
    }

    if (!file.endsWith('.js')) continue;
    try {
      const cmd = require(full);
      if (cmd && cmd.name) {
        commands.set(cmd.name, cmd);
      } else {
        // try filename as command name fallback
        const name = path.basename(file, '.js');
        commands.set(name, cmd);
      }
    } catch (e) {
      console.error(`Failed loading command ${file}:`, e);
    }
  }

  return commands;
}

function loadEvents(dir = EVENTS_DIR) {
  const events = [];

  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Events directory not found: ${dir} — returning empty events list`);
    return events;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const full = path.join(dir, file);
    try {
      const ev = require(full);
      // expect ev to export { name, run, once? }
      if (ev && typeof ev.run === 'function') {
        events.push(ev);
      } else {
        console.warn(`Event ${file} does not export run() — skipping`);
      }
    } catch (e) {
      console.error(`Failed loading event ${file}:`, e);
    }
  }

  return events;
}

// If you have custom loaders in your project, replace above functions with:
// const { loadCommands, loadEvents } = require('./path/to/your/loaders');
// const commands = loadCommands();
// const events = loadEvents();

const commands = loadCommands();
const events = loadEvents();

console.log(`✓ Loaded ${commands.size} commands`);
console.log(`✓ Loaded ${events.length} events`);

// ----------------- Load fbstate -----------------
let appState = undefined;
try {
  if (fs.existsSync(FBSTATE_PATH)) {
    appState = JSON.parse(fs.readFileSync(FBSTATE_PATH, 'utf8'));
    console.log('✓ Facebook state loaded (fbstate.json)');
  } else {
    console.warn('⚠️ fbstate.json not found. A fresh login will be required.');
  }
} catch (err) {
  console.error('❌ Error loading fbstate.json:', err.message);
  // don't exit; login may still proceed (but may require credentials)
}

// ----------------- Start Facebook login -----------------
login({ appState }, (err, api) => {
  if (err) {
    console.error('❌ Facebook login error:', err);
    return;
  }

  console.log('✓ Facebook login successful');

  // setOptions as in your sample
  try {
    api.setOptions({
      listenEvents: true,
      selfListen: false,
      updatePresence: true,
      forceLogin: true,
      mqttDisabled: false // note: comment said not needed, but kept for backward compatibility
    });
  } catch (e) {
    console.warn('⚠️ api.setOptions failed or api not support setOptions:', e.message || e);
  }

  console.log('🤖 Bot is now online and ready!');
  console.log('═══════════════════════════════════════════');

  // Run "once" events first (if event object has once property)
  for (const ev of events.filter(e => e.once)) {
    try {
      if (typeof ev.run === 'function') ev.run({ api, config, commands, event: null });
    } catch (e) {
      console.error(`Error running once event ${ev.name || '<unnamed>'}:`, e);
    }
  }

  // Long-poll / listen loop
  if (typeof api.listen !== 'function') {
    console.error('❌ api.listen is not a function. Cannot start event listener.');
    return;
  }

  api.listen(async (err, event) => {
    if (err) {
      console.error('Listen error:', err);
      return;
    }

    // Run all events handlers
    for (const eventHandler of events) {
      try {
        // skip once-only handlers (they already ran)
        if (eventHandler.once) continue;
        await eventHandler.run({ event, api, config, commands });
      } catch (error) {
        console.error(`Error in event ${eventHandler.name || '<unnamed>'}:`, error);
      }
    }

    // Message handler (keep existing path if present)
    if (event && (event.type === 'message' || event.type === 'message_reply')) {
      try {
        // adjust path if your project has different location
        const messageHandlerPath = path.join(__dirname, 'shourov', 'events', 'message');
        const messageHandler = require(messageHandlerPath);
        if (messageHandler && typeof messageHandler.run === 'function') {
          await messageHandler.run({ event, api, config, commands });
        } else {
          console.warn('⚠️ message handler did not export run()');
        }
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  });

  // Optional: save fbstate periodically if api exposes getAppState or similar
  // e.g. fs.writeFileSync(FBSTATE_PATH, JSON.stringify(api.getAppState(), null, 2));
});
