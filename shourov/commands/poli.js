module.exports = {
    config: { name: 'poli', aliases: ['poll'], role: 0, description: 'Create poll' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /poli option1|option2|option3', event.threadID);
        api.sendMessage(`📊 Poll: ${args.join(' ')}`, event.threadID);
    }
};
