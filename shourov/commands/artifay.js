const axios = require('axios');

module.exports = {
    config: {
        name: 'artifay',
        aliases: ['artificial', 'ai-art'],
        role: 0,
        description: 'Generate AI art (alternative)'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a description!\nUsage: /artifay <description>', event.threadID);
        }

        const prompt = args.join(' ');
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;

        api.sendMessage(`✅ AI Art Generated!\n\n📝 Prompt: ${prompt}\n🔗 View: ${imageUrl}`, event.threadID);
    }
};
