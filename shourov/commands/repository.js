module.exports = {
    config: { name: 'repository', aliases: ['repo-info'], role: 0, description: 'Repository info' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /repository <owner>/<repo>', event.threadID);
        api.sendMessage(`📦 Repository\n\n${args.join(' ')}`, event.threadID);
    }
};
