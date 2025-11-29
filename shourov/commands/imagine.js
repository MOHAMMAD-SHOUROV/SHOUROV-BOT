module.exports = {
    config: { name: 'imagine', aliases: ['imagine-pic'], role: 0, description: 'Imagine something' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /imagine <description>', event.threadID);
        const text = args.join(' ');
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}`;
        api.sendMessage(`🎨 Imagined:\n\n${text}\n\n🔗 ${url}`, event.threadID);
    }
};
