// shourovbot/alihsan/shourova.js (CLEAN, unified listener + loaders)
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

// ---------- Robust language loader ----------
(function loadLanguageSafely() {
  let langCode = 'en';
  try {
    if (config && config.language) langCode = String(config.language).toLowerCase();
    else if (process.env.LANG_CODE) langCode = String(process.env.LANG_CODE).toLowerCase();
    else if (process.env.LANG) langCode = String(process.env.LANG).split(/[_\.]/)[0].toLowerCase();
  } catch (e) { langCode = 'en'; }

  const candidates = [
    path.join(__dirname, 'languages', `${langCode}.lang`),
    path.join(__dirname, 'languages', 'en.lang'),
    path.join(__dirname, '..', 'languages', `${langCode}.lang`),
    path.join(__dirname, '..', 'languages', 'en.lang')
  ];

  let found = null;
  for (const p of candidates) if (fs.existsSync(p)) { found = p; break; }
  if (!found) {
    console.error('❌ Failed to load language file (checked: ' + candidates.join(', ') + ')');
    throw new Error('Language file not found');
  }

  const raw = fs.readFileSync(found, 'utf8');

  try {
    global.language = JSON.parse(raw);
    console.log('✓ Language loaded (JSON):', path.basename(found));
    return;
  } catch (jsonErr) { /* fallback */ }

  const result = {};
  for (const line0 of raw.split(/\r?\n/)) {
    const line = line0.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('//')) continue;
    const m = line.match(/^([^=:#]+?)\s*(?:=|:)\s*(.+)$/);
    if (m) result[m[1].trim()] = m[2].trim();
    else {
      const p = line.split(/\s+/, 2);
      if (p.length === 2) result[p[0]] = p[1];
    }
  }
  if (Object.keys(result).length === 0) {
    console.error('❌ Failed to parse language file (no key=value pairs found):', found);
    throw new Error('Language parse failed');
  }
  global.language = result;
  console.log('✓ Language loaded (key=value fallback):', path.basename(found));
})();

// ---------- Protection checks ----------
if (!config) { console.error('❌ No config loaded — aborting.'); process.exit(1); }
if (config.author !== "ALIHSAN SHOUROV") { console.error('❌ CRITICAL ERROR: Author protection violated!'); process.exit(1); }
if (config.ownerId !== "100071971474157") { console.error('❌ CRITICAL ERROR: Owner ID protection violated!'); process.exit(1); }

console.log('✓ Author protection: PASSED');
console.log('✓ Owner ID protection: PASSED');
console.log('');

// ---------- Start uptime server (optional) ----------
try {
  if (typeof startUptimeServer === 'function') {
    startUptimeServer(config);
    console.log('✓ Uptime server started (if configured)');
  }
} catch (err) {
  console.error('❌ Failed to start uptime server:', err && err.message);
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
  console.error('❌ Error reading fbstate.json:', err && err.message);
}

// ---------- Prepare commands & events loader (will load ONCE) ----------
const COMMANDS_DIR = path.join(__dirname, '..', 'shourov', 'commands');
const EVENTS_DIR = path.join(__dirname, '..', 'shourov', 'events');

const commands = new Map();
const eventHandlers = [];

// load commands (safe)
try {
  if (fs.existsSync(COMMANDS_DIR)) {
    const cmdFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.js'));
    console.log('Commands found:', cmdFiles);
    for (const f of cmdFiles) {
      try {
        const p = path.join(COMMANDS_DIR, f);
        delete require.cache[require.resolve(p)];
        const cmd = require(p);
        if (cmd && cmd.name && typeof cmd.run === 'function') {
          commands.set(String(cmd.name).toLowerCase(), cmd);
          console.log('Loaded command', f, '->', cmd.name);
        } else {
          console.log('Invalid command file (no name/run):', f);
        }
      } catch (e) {
        console.error('Error loading command', f, e && e.message);
      }
    }
  } else {
    console.warn('Commands dir not found:', COMMANDS_DIR);
  }
} catch (e) {
  console.error('Error scanning commands dir:', e && e.message);
}

// load events (safe)
try {
  if (fs.existsSync(EVENTS_DIR)) {
    const evFiles = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.js'));
    console.log('Events found:', evFiles);
    for (const f of evFiles) {
      try {
        const p = path.join(EVENTS_DIR, f);
        delete require.cache[require.resolve(p)];
        const ev = require(p);
        if (ev && typeof ev.run === 'function') {
          eventHandlers.push(ev);
          console.log('Loaded event', f);
        } else {
          console.log('Invalid event file (no run()):', f);
        }
      } catch (e) {
        console.error('Error loading event', f, e && e.message);
      }
    }
  } else {
    console.warn('Events dir not found:', EVENTS_DIR);
  }
} catch (e) {
  console.error('Error scanning events dir:', e && e.message);
}

// ---------- Start login & unified listener ----------
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
    console.warn('⚠️ api.setOptions failed (maybe different API version):', e && e.message);
  }

  // Save fbstate on login update (optional)
  try {
    if (api.getAppState && typeof api.getAppState === 'function') {
      const newState = api.getAppState();
      fs.writeFileSync(FBSTATE_PATH, JSON.stringify(newState, null, 2), 'utf8');
      console.log('✓ fbstate.json updated');
    }
  } catch (e) { /* ignore */ }

  console.log('═══════════════════════════════════════════');
  console.log('🤖 Bot is now online and ready!');
  console.log('═══════════════════════════════════════════');

  if (!api.listen) {
    console.warn('⚠️ api.listen is not available on this API object.');
    return;
  }

  api.listen(async (errListen, event) => {
    if (errListen) {
      console.error('Listen error:', errListen);
      return;
    }

    // debug: show event type & thread
    const threadID = (event && (event.threadID || (event.thread_key && event.thread_key.thread_fbid) || event.senderID)) || null;
    console.log('EVENT RECEIVED:', event && event.type, 'thread:', threadID);

    // 1) run generic event handlers (on every event)
    for (const evHandler of eventHandlers) {
      try {
        await evHandler.run({ event, api, config, language: global.language, commands });
      } catch (e) {
        console.error('Error in event handler:', e && e.message);
      }
    }

    // 2) call message handler module if exists (keeps backward compatibility)
    try {
      const messageHandlerPath = path.join(__dirname, '..', 'shourov', 'events', 'message.js');
      if (fs.existsSync(messageHandlerPath)) {
        delete require.cache[require.resolve(messageHandlerPath)];
        const messageHandler = require(messageHandlerPath);
        if (messageHandler && typeof messageHandler.run === 'function') {
          await messageHandler.run({ event, api, config, language: global.language, commands });
        }
      }
    } catch (e) {
      console.error('Error in message handler:', e && e.message);
    }

    // 3) simple command dispatch for incoming messages (first word = command)
    try {
      if (event && (event.type === 'message' || event.type === 'message_reply')) {
        const text = (event.body || '').toString().trim();
        if (text) {
          const parts = text.split(/\s+/);
          const cmdName = (parts[0] || '').toLowerCase();
          const args = parts.slice(1);
          if (commands.has(cmdName)) {
            const cmd = commands.get(cmdName);
            try {
              await cmd.run({ event, api, config, args, language: global.language, commands });
            } catch (e) {
              console.error('Command', cmdName, 'failed:', e && e.message);
            }
          }
        }

        // mark as read (best-effort)
        try {
          if (threadID) {
            if (typeof api.markAsRead === 'function') api.markAsRead(threadID, () => {});
            else if (typeof api.setMessageRead === 'function') api.setMessageRead(threadID, () => {});
            else if (typeof api.markSeen === 'function') api.markSeen(threadID, () => {});
          }
        } catch (e) { console.warn('mark-as-read failed:', e && e.message); }

        // auto-reply (toggle with flag)
        try {
          const autoReply = false; // <-- set true to enable auto-reply
          if (autoReply && threadID) {
            const replyText = 'Thanks — message received!';
            if (typeof api.sendMessage === 'function') api.sendMessage({ body: replyText }, threadID, () => {});
            else if (typeof api.send === 'function') api.send({ body: replyText }, threadID, () => {});
          }
        } catch (e) { console.warn('auto-reply failed:', e && e.message); }
      }
    } catch (outerErr) {
      console.error('Message processing failed:', outerErr && outerErr.message);
    }
  }); // end api.listen
}); // end login

// Graceful shutdown
process.on('SIGINT', () => { console.log('Received SIGINT. Exiting...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('Received SIGTERM. Exiting...'); process.exit(0); });
EOF
