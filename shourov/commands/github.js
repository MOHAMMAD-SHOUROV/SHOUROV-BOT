module.exports = {
    config: { name: 'github', aliases: ['gh', 'repo'], role: 0, description: 'GitHub helper' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('🐙 GitHub\n\n🔗 https://github.com\n💻 Share repositories and code!', event.threadID);
        const repo = args[0];
        api.sendMessage(`🐙 Repository: ${repo}\n\n🔗 https://github.com/search?q=${repo}`, event.threadID);
    }
};
