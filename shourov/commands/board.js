module.exports = {
    config: {
        name: 'board',
        aliases: ['bulletin', 'notice'],
        role: 1,
        description: 'Post bulletin board message'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide a message!\nUsage: /board <message>', event.threadID);
        }

        const bulletin = args.join(' ');

        const message = `
📌 BULLETIN BOARD 📌

${bulletin}

━━━━━━━━━━━━━━━
Posted by: Admin
Time: ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━
        `.trim();

        api.sendMessage(message, event.threadID);
    }
};
