const axios = require('axios');

module.exports = {
    config: {
        name: 'ai2',
        aliases: ['gpt4', 'chatbot2'],
        role: 0,
        description: 'Alternative AI chat with different personality'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a question!\nUsage: /ai2 <your question>', event.threadID);
        }

        const question = args.join(' ');
        
        api.sendMessage('🤖 AI2 is processing...', event.threadID, async (err, info) => {
            try {
                const response = await axios.get(`https://api.affiliateplus.xyz/api/chatgpt?question=${encodeURIComponent(question)}&model=gpt-4`, {
                    timeout: 30000
                });

                let answer = response.data.answer || response.data.response || response.data.message;
                
                if (!answer) {
                    throw new Error('No response from API');
                }
                
                api.editMessage(`🤖 AI2 Advanced Response:\n\n${answer}`, info.messageID);
            } catch (error) {
                console.error('AI2 error:', error.message);
                api.editMessage('❌ AI2 is unavailable. Please try again later.', info.messageID);
            }
        });
    }
};
