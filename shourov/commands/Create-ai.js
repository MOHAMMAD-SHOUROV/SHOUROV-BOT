const axios = require('axios');

module.exports = {
    config: {
        name: 'create-ai',
        aliases: ['createai', 'genai'],
        role: 0,
        description: 'Generate AI images with advanced prompts'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a detailed description!\nUsage: /create-ai <detailed description>\nExample: /create-ai beautiful sunset over mountains, realistic, 4k', event.threadID);
        }

        const prompt = args.join(' ');
        
        api.sendMessage('🎨 Creating AI artwork...', event.threadID, async (err, info) => {
            try {
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
                
                api.editMessage(`✅ AI Artwork Created!\n\n📝 Prompt: ${prompt}\n🎨 Quality: High\n📏 Size: 1024x1024\n\n🔗 View: ${imageUrl}`, info.messageID);
            } catch (error) {
                console.error('Create-AI error:', error.message);
                api.editMessage('❌ Failed to create AI artwork. Please try again.', info.messageID);
            }
        });
    }
};
