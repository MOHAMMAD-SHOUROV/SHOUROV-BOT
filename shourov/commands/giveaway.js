module.exports = {
    config: { name: 'giveaway', aliases: ['gw', 'contest'], role: 1, description: 'Giveaway management' },
    run: async ({ api, event, args }) => {
        if (!event.isGroup) return api.sendMessage('❌ Group only!', event.threadID);
        if (args.length === 0) return api.sendMessage('❌ Usage: /giveaway <prize>', event.threadID);
        const prize = args.join(' ');
        api.sendMessage(`🎉 GIVEAWAY!\n\n🏆 Prize: ${prize}\n\n📢 React to enter!\n⏰ Winners will be announced!`, event.threadID);
    }
};
