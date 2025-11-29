const fs = require('fs');
const path = require('path');
// login module (local - project likely has this)
const login = require('./shourovbot/system/login');
// express only used by uptime server (kept for completeness)
const express = require('express');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const FBSTATE_PATH = path.join(__dirname, 'fbstate.json');

// --- helper loaders (if you already have loaders, you can replace these) ---
function loadCommands(dir = path.join(__dirname, 'shourov', 'commands')) {
    const map = new Map();
    try {
        if (!fs.existsSync(dir)) return map;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const f of files) {
            try {
                const cmd = require(path.join(dir, f));
                const name = cmd.name || path.basename(f, '.js');
                map.set(name, cmd);
            } catch (e) {
                console.error(Failed to load command ${f}:, e.message);
            }
        }
    } catch (e) {
        console.error('loadCommands error:', e.message);
    }
    return map;
}

function loadEvents(dir = path.join(__dirname, 'shourov', 'events')) {
    const arr = [];
    try {
        if (!fs.existsSync(dir)) return arr;
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const f of files) {
            try {
                const ev = require(path.join(dir, f));
                // event should export something like { name, run }
                arr.push(ev);
            } catch (e) {
                console.error(Failed to load event ${f}:, e.message);
            }
        }
    } catch (e) {
        console.error('loadEvents error:', e.message);
    }
    return arr;
}
// -------------------------------------------------------------------------

// read config
let config;
try {
    if (!fs.existsSync(CONFIG_PATH)) throw new Error('config.json not found');
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (err) {
    console.error('❌ Error reading config.json:', err.message);
    process.exit(1);
}

console.log('═══════════════════════════════════════════');
console.log('   SHOUROV-BOT - Facebook Messenger Bot   ');
console.log('═══════════════════════════════════════════');

// Protection checks
if (config.author !== "ALIHSAN SHOUROV") {
    console.error('❌ CRITICAL ERROR: Author protection violated!');
    process.exit(1);
}

if (String(config.ownerId) !== "100071971474157") {
    console.error('❌ CRITICAL ERROR: Owner ID protection violated!');
    process.exit(1);
}

console.log('✓ Author protection: PASSED');
console.log('✓ Owner ID protection: PASSED');
console.log('');

// Start uptime server (expects ./server/uptime.js to export a function)
const startUptimeServerPath = path.join(__dirname, 'server', 'uptime.js');
if (fs.existsSync(startUptimeServerPath)) {
    const startUptimeServer = require(startUptimeServerPath);
    try {
        startUptimeServer(config);
        console.log('✓ Uptime server started (server/uptime.js)');
    } catch (e) {
        console.warn('⚠  Could not start uptime server:', e.message);
    }
} else {
    console.log('ℹ  server/uptime.js not found — skipping uptime server start');
}

// Load fbstate
let appState;
try {
    if (!fs.existsSync(FBSTATE_PATH)) throw new Error('fbstate.json not found');
    appState = JSON.parse(fs.readFileSync(FBSTATE_PATH, 'utf8'));
    console.log('✓ Facebook state loaded');
} catch (err) {
    console.error('❌ Error loading fbstate.json:', err.message);
    process.exit(1);
}

// Start Facebook login
// login should be a function that accepts ({appState}, callback) like facebook-chat-api
if (typeof login !== 'function') {
    console.error('❌ login module does not export a function at ./shourovbot/system/login');
    process.exit(1);
}

login({ appState }, async (err, api) => {
    if (err) {
        console.error('❌ Facebook login error:', err);
        return;
    }

    console.log('✓ Facebook login successful');

    // set default options (some options depend on API implementation)
    try {
        if (api.setOptions && typeof api.setOptions === 'function') {
            api.setOptions({
                listenEvents: true,
                selfListen: false,
                updatePresence: true,
                forceLogin: true,
                mqttDisabled: false
            });
        }
    } catch (e) {
        console.warn('⚠  Could not set api options:', e.message);
    }

    // load commands/events using helper functions above (they scan shourov/commands and shourov/events)
    const commands = loadCommands();
    const events = loadEvents();

    console.log(✓ Loaded ${commands.size} commands);
    console.log(✓ Loaded ${events.length} events);
    console.log('🤖 Bot is now online and ready!');
    console.log('═══════════════════════════════════════════');

    // Listener / long polling
    if (!api.listen || typeof api.listen !== 'function') {
        console.error('❌ api.listen is not available on the provided login API');
        return;
    }

    api.listen(async (listenErr, event) => {
        if (listenErr) return console.error('Listen error:', listenErr);

        // Run event handlers (simple loop)
        for (const eventHandler of events) {
            try {
                if (eventHandler && typeof eventHandler.run === 'function') {
                    await eventHandler.run({ event, api, config, commands });
                }
            } catch (error) {
                console.error(Error in event ${eventHandler && eventHandler.name}:, error);
            }
        }

        // Message handler (try shourov/events/message.js first)
        if (event.type === 'message' || event.type === 'message_reply') {
            const messageHandlerPath = path.join(__dirname, 'shourov', 'events', 'message.js');
            try {
                if (!fs.existsSync(messageHandlerPath)) {
                    console.warn('⚠  Message handler not found at shourov/events/message.js — skipping');
                    return;
                }
                const messageHandler = require(messageHandlerPath);
                if (messageHandler && typeof messageHandler.run === 'function') {
                    await messageHandler.run({ event, api, config, commands });
                } else {
                    console.warn('⚠  Message handler does not export run()');
                }
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        }
    });
});
