module.exports = {
    config: { name: 'gitlink', aliases: ['gh-link'], role: 0, description: 'GitHub link generator' },
    run: async ({ api, event, args }) => {
        if (args.length < 2) return api.sendMessage('❌ Usage: /gitlink <user> <repo>', event.threadID);
        const link = `https://github.com/${args[0]}/${args[1]}`;
        api.sendMessage(`🐙 GitHub Link\n\n🔗 ${link}`, event.threadID);
    }
};
