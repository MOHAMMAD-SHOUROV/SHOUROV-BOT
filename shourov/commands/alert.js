module.exports = {
    config: {
        name: 'alert',
        aliases: ['notify', 'announce'],
        role: 1,
        description: 'Send alert notification to group'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide an alert message!\nUsage: /alert <message>', event.threadID);
        }

        const alertMessage = args.join(' ');
        
        const formattedAlert = `
🚨 ALERT NOTIFICATION 🚨

${alertMessage}

⚠️ This is an important announcement
📢 Please read carefully
        `.trim();

        api.sendMessage(formattedAlert, event.threadID);
    }
};
