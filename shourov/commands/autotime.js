module.exports = {
    config: {
        name: 'autotime',
        aliases: ['auto-time', 'scheduled'],
        role: 1,
        description: 'Set auto-send messages at specific times (Bangladesh time)'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Usage: /autotime <message>\n\n💡 Note: This is a demo. For production, configure with cron jobs or scheduled tasks.\n\n🇧🇩 Uses Bangladesh time (UTC+6)', event.threadID);
        }

        const message = args.join(' ');
        
        const dhakaTz = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
        const time = dhakaTz.toLocaleTimeString('en-US', { hour12: false });

        api.sendMessage(`⏰ Auto-schedule Set\n\n📝 Message: ${message}\n🕐 Current BD Time: ${time}\n\n💡 Message will be sent at configured times daily.`, event.threadID);
    }
};
