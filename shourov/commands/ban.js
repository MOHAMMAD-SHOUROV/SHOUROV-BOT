const fs = require('fs');
const path = require('path');

const banListPath = path.join(__dirname, '..', '..', 'banlist.json');

function getBanList() {
    try {
        if (fs.existsSync(banListPath)) {
            return JSON.parse(fs.readFileSync(banListPath, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading ban list:', error);
    }
    return [];
}

function saveBanList(banList) {
    try {
        fs.writeFileSync(banListPath, JSON.stringify(banList, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving ban list:', error);
        return false;
    }
}

module.exports = {
    config: {
        name: 'ban',
        aliases: ['block', 'unban'],
        role: 2,
        description: 'Ban/unban users from using the bot'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage(
                '❌ Usage:\n/ban add <userID|@mention> - Ban user\n/ban remove <userID|@mention> - Unban user\n/ban list - Show banned users',
                event.threadID
            );
        }

        const action = args[0].toLowerCase();
        const banList = getBanList();

        if (action === 'list') {
            if (banList.length === 0) {
                return api.sendMessage('✅ No users are currently banned.', event.threadID);
            }

            let message = '🚫 BANNED USERS:\n\n';
            for (const userID of banList) {
                try {
                    const userInfo = await api.getUserInfo(userID);
                    const name = userInfo[userID]?.name || 'Unknown';
                    message += `• ${name} (${userID})\n`;
                } catch (error) {
                    message += `• ${userID}\n`;
                }
            }
            return api.sendMessage(message, event.threadID);
        }

        let targetID;
        if (Object.keys(event.mentions).length > 0) {
            targetID = Object.keys(event.mentions)[0];
        } else if (args.length > 1 && !isNaN(args[1])) {
            targetID = args[1];
        } else {
            return api.sendMessage('❌ Please mention a user or provide a valid user ID!', event.threadID);
        }

        if (action === 'add') {
            if (banList.includes(targetID)) {
                return api.sendMessage('❌ This user is already banned!', event.threadID);
            }

            banList.push(targetID);
            if (saveBanList(banList)) {
                try {
                    const userInfo = await api.getUserInfo(targetID);
                    const name = userInfo[targetID]?.name || targetID;
                    api.sendMessage(`✅ Successfully banned ${name}!`, event.threadID);
                } catch (error) {
                    api.sendMessage(`✅ Successfully banned user ${targetID}!`, event.threadID);
                }
            } else {
                api.sendMessage('❌ Failed to save ban list!', event.threadID);
            }
        } else if (action === 'remove') {
            const index = banList.indexOf(targetID);
            if (index === -1) {
                return api.sendMessage('❌ This user is not banned!', event.threadID);
            }

            banList.splice(index, 1);
            if (saveBanList(banList)) {
                try {
                    const userInfo = await api.getUserInfo(targetID);
                    const name = userInfo[targetID]?.name || targetID;
                    api.sendMessage(`✅ Successfully unbanned ${name}!`, event.threadID);
                } catch (error) {
                    api.sendMessage(`✅ Successfully unbanned user ${targetID}!`, event.threadID);
                }
            } else {
                api.sendMessage('❌ Failed to save ban list!', event.threadID);
            }
        } else {
            api.sendMessage('❌ Invalid action! Use: add, remove, or list', event.threadID);
        }
    }
};
