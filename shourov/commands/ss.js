const axios = require('axios');

module.exports = {
    config: {
        name: 'ss',
        aliases: ['screenshot', 'capture'],
        role: 0,
        description: 'Take a screenshot of a website'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a URL!\nUsage: /ss <website_url>', event.threadID);
        }

        let url = args[0];
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        api.sendMessage('📸 Taking screenshot...', event.threadID, async (err, info) => {
            try {
                const screenshotUrl = `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=1024x768`;
                
                api.editMessage(`📸 Screenshot captured!\n\n🌐 Website: ${url}\n\n🔗 View: ${screenshotUrl}`, info.messageID);
            } catch (error) {
                console.error('Screenshot error:', error.message);
                api.editMessage('❌ Failed to take screenshot. Please check the URL.', info.messageID);
            }
        });
    }
};
