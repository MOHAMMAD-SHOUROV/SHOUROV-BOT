const axios = require('axios');

module.exports = {
    config: {
        name: '4k',
        aliases: ['upscale', 'enhance'],
        role: 0,
        description: 'Upscale images to higher quality'
    },
    run: async ({ api, event, config }) => {
        if (event.type !== 'message_reply' || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
            return api.sendMessage('❌ Please reply to an image with this command!\nUsage: Reply to an image with /4k', event.threadID);
        }

        const attachment = event.messageReply.attachments[0];
        
        if (attachment.type !== 'photo') {
            return api.sendMessage('❌ Please reply to a photo/image!', event.threadID);
        }

        const imageUrl = attachment.url;
        const apiKey = process.env.DEEPAI_API_KEY || (config && config.deepaiApiKey);

        if (!apiKey) {
            return api.sendMessage(`⚠️ 4K Upscaling Requires Configuration\n\n📸 Original Image: ${imageUrl}\n\n💡 To enable AI upscaling:\n1. Get a free API key from deepai.org\n2. Set DEEPAI_API_KEY environment variable\nOR\n3. Add "deepaiApiKey" to config.json\n\n🔧 Free online alternatives:\n• waifu2x.udp.jp\n• letsenhance.io\n• bigjpg.com`, event.threadID);
        }

        api.sendMessage('📸 Upscaling image with AI...', event.threadID, async (err, info) => {
            try {
                const response = await axios({
                    method: 'POST',
                    url: 'https://api.deepai.org/api/waifu2x',
                    headers: {
                        'api-key': apiKey
                    },
                    data: {
                        image: imageUrl
                    },
                    timeout: 60000
                });

                if (response.data && response.data.output_url) {
                    api.editMessage(`✅ Image Upscaled Successfully!\n\n🎨 Enhanced: ${response.data.output_url}\n\n💡 Processed with AI upscaling technology!`, info.messageID);
                } else {
                    throw new Error('No output URL received from API');
                }
            } catch (error) {
                console.error('4K upscale error:', error.message);
                
                const errorMsg = error.response?.status === 429 
                    ? '⚠️ API rate limit reached. Please wait or use your own API key.'
                    : `⚠️ Upscaling failed: ${error.message}`;
                
                api.editMessage(`${errorMsg}\n\n📸 Original: ${imageUrl}\n\n🔧 Free alternatives:\n• waifu2x.udp.jp\n• letsenhance.io\n• bigjpg.com`, info.messageID);
            }
        });
    }
};
