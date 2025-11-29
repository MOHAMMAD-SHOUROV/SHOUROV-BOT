const axios = require('axios');

module.exports = {
    config: {
        name: 'create',
        aliases: ['gen', 'generate'],
        role: 0,
        description: 'Quick AI image generation'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a description!\nUsage: /create <description>', event.threadID);
        }

        const prompt = args.join(' ');
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=800`;

        api.sendMessage(`✅ Image Generated!\n\n📝 ${prompt}\n\n🔗 ${imageUrl}`, event.threadID);
    }
};
