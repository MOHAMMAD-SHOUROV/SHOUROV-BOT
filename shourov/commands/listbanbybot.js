const fs = require('fs');
const path = require('path');

module.exports = {
    config: { name: 'listbanbybot', aliases: ['banned-list'], role: 2, description: 'List banned users' },
    run: async ({ api, event }) => {
        try {
            const banlist = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'banlist.json'), 'utf8'));
            api.sendMessage(`🚫 Banned: ${banlist.length} users`, event.threadID);
        } catch (error) {
            api.sendMessage('✅ No banned users', event.threadID);
        }
    }
};
