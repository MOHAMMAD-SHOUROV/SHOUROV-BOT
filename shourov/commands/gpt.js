const axios = require('axios');

module.exports = {
    config: {
        name: 'gpt',
        aliases: ['chatgpt', 'openai'],
        role: 0,
        description: 'Chat with GPT AI'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a question!\nUsage: /gpt <your question>', event.threadID);
        }

        const question = args.join(' ');
        
        api.sendMessage('🤖 GPT is thinking...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.affiliateplus.xyz/api/chatgpt?question=${encodeURIComponent(question)}`, {
                    timeout: 30000
                });

                let answer = response.data.answer || response.data.response || response.data.message || 'Sorry, I could not generate a response.';
                
                api.editMessage(`🤖 GPT Response:\n\n${answer}`, info.messageID);
            } catch (error) {
                console.error('GPT API Error:', error.message);
                api.editMessage('❌ Failed to get GPT response. Please try again later.', info.messageID);
            }
        });
    }
};
