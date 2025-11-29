const fs = require('fs');
const login = require('facebook-chat-api');
const express = require('express');

global.utils = require("../../utils/utils.js");
global.nayanConfig = require("../../shourov.json");
const config = JSON.parse(fs.readFileSync('../../config.json', 'utf8'));
const { loadCommands, loadEvents } = require('../../shourov/loader');

console.log('═══════════════════════════════════════════');
console.log('   SHOUROV-BOT - Facebook Messenger Bot   ');
console.log('═══════════════════════════════════════════');

// Protection checks
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

// Start uptime server
const startUptimeServer = require('../../server/uptime');
startUptimeServer(config);

// Load fbstate
let appState;
try {
    appState = JSON.parse(fs.readFileSync('../../fbstate.json', 'utf8'));
    console.log('✓ Facebook state loaded');
} catch (err) {
    console.error('❌ Error loading fbstate.json:', err.message);
    process.exit(1);
}

// Start Facebook login
login({ appState }, (err, api) => {
    if (err) {
        console.error('❌ Facebook login error:', err);
        return;
    }

    console.log('✓ Facebook login successful');

    api.setOptions({
        listenEvents: true,
        selfListen: false,
        updatePresence: true,
        forceLogin: true,
        mqttDisabled: false
        // ❗ mqttDisabled is no longer needed
    });

    const commands = loadCommands();
    const events = loadEvents();

    console.log(`✓ Loaded ${commands.size} commands`);
    console.log(`✓ Loaded ${events.length} events`);
    console.log('🤖 Bot is now online and ready!');
    console.log('═══════════════════════════════════════════');

    // ✔ FIX: Long polling listener (100% works on RENDER)
    api.listen(async (err, event) => {
        if (err) return console.error('Listen error:', err);

        // Run event handlers
        for (const eventHandler of events) {
            try {
                await eventHandler.run({ event, api, config, commands });
            } catch (error) {
                console.error(`Error in event ${eventHandler.name}:`, error);
            }
        }

        // Run message handler
        if (event.type === 'message' || event.type === 'message_reply') {
            try {
                const messageHandler = require('../../shourov/events/message');
                await messageHandler.run({ event, api, config, commands });
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        }
    });
});
