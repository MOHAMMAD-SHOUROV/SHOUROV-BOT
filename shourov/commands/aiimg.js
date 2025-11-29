const axios = require('axios');

module.exports = {
    config: {
        name: 'aiimg',
        aliases: ['imagine', 'genimage'],
        role: 0,
        description: 'Generate AI images from text'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a description!\nUsage: /aiimg <description>', event.threadID);
        }

        const prompt = args.join(' ');
        
        api.sendMessage('🎨 Generating image...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                api.editMessage(`✅ Image generated!\n📝 Prompt: ${prompt}\n\n🔗 View: https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`, info.messageID);
            } catch (error) {
                console.error('AI Image error:', error.message);
                api.editMessage('❌ Failed to generate image. Please try again.', info.messageID);
            }
        });
    }
};
