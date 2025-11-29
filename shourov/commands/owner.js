module.exports = {
    config: { name: 'owner', aliases: ['owner-info'], role: 0, description: 'Owner information' },
    run: async ({ api, event, config }) => {
        api.sendMessage(`👑 Owner\n\n📝 ${config.author}\n🆔 ${config.ownerId}`, event.threadID);
    }
};
