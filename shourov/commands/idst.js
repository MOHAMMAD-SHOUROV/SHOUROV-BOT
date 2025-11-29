module.exports = {
    config: { name: 'idst', aliases: ['identify'], role: 0, description: 'Identify user' },
    run: async ({ api, event, args }) => {
        try {
            let userID = event.senderID;
            if (Object.keys(event.mentions).length > 0) userID = Object.keys(event.mentions)[0];
            const user = await api.getUserInfo(userID);
            api.sendMessage(`👤 ${user[userID].name}\n\n🆔 ID: ${userID}`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Error', event.threadID);
        }
    }
};
