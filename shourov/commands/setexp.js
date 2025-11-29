module.exports = {
    config: { name: 'setexp', aliases: [], role: 2, description: 'Set XP' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /setexp <amount>', event.threadID);
        api.sendMessage(`✅ XP set to: ${args[0]}`, event.threadID);
    }
};
