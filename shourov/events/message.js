const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '..', '..', 'banlist.json');

function getBanList() {
    try {
        if (!fs.existsSync(banListPath)) {
            fs.writeFileSync(banListPath, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(banListPath, 'utf8'));
    } catch (error) {
        console.error('Error reading ban list:', error);
        return [];
    }
}

module.exports = {
    run: async ({ event, api, config, commands }) => {
        try {
            if (!event.body) return;

            const body = event.body.trim();
            if (!body.startsWith(config.prefix)) return;

            const args = body.slice(config.prefix.length).trim().split(/\s+/);
            const commandName = args.shift().toLowerCase();

            const command = commands.get(commandName);
            if (!command) return;

            // Load banlist
            const banList = getBanList();
            if (banList.includes(event.senderID)) {
                return api.sendMessage('❌ You are banned from using this bot.', event.threadID, event.messageID);
            }

            // Roles
            const senderID = String(event.senderID);
            const ownerID = String(config.ownerId).trim();

            const isOwner = senderID === ownerID;
            const isAdmin = config.admins.map(String).includes(senderID);
            const isOperator = config.operators.map(String).includes(senderID);

            let userRole = 0;
            if (isOwner) userRole = 2;
            else if (isAdmin || isOperator) userRole = 1;

            // Permission check
            if (command.config.role > userRole) {
                return api.sendMessage(
                    '❌ You do not have permission to use this command.',
                    event.threadID,
                    event.messageID
                );
            }

            // Execute command
            await command.run({
                api,
                event,
                args,
                config,
                commands,
                userRole
            });

        } catch (error) {
            console.error('❌ message.js internal error:', error);
            try {
                api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
            } catch (_) {}
        }
    }
};
