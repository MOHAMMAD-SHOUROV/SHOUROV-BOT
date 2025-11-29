const fs = require('fs');

module.exports = {
    config: {
        name: 'appstate',
        aliases: ['session', 'state'],
        role: 2,
        description: 'Manage bot session state (Owner only)'
    },
    run: async ({ api, event }) => {
        try {
            const fbstate = JSON.parse(fs.readFileSync('./fbstate.json', 'utf8'));
            const stateSize = JSON.stringify(fbstate).length / 1024;
            
            api.sendMessage(`📋 Bot Session State\n\n📊 State Size: ${stateSize.toFixed(2)} KB\n✅ Status: Valid\n\n💡 To update session: Replace fbstate.json with new cookies`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Session state is invalid or empty. Please update fbstate.json', event.threadID);
        }
    }
};
