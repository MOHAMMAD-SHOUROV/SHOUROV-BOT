module.exports = {
    config: { name: 'rainbow', aliases: ['colorful'], role: 0, description: 'Rainbow colors' },
    run: async ({ api, event, args }) => {
        const text = args.join(' ') || 'RAINBOW';
        api.sendMessage(`🌈 ${text}\n\n🎨 Colorful!`, event.threadID);
    }
};
