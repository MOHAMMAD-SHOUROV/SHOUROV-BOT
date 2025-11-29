module.exports = {
    config: {
        name: 'reminder',
        aliases: ['remind', 'timer'],
        role: 0,
        description: 'Set a reminder'
    },
    run: async ({ api, event, args }) => {
        if (args.length < 2) {
            return api.sendMessage('❌ Usage: /reminder <seconds> <message>\nExample: /reminder 60 Check the oven', event.threadID);
        }

        const seconds = parseInt(args[0]);
        
        if (isNaN(seconds) || seconds <= 0) {
            return api.sendMessage('❌ Please provide a valid number of seconds!', event.threadID);
        }

        if (seconds > 86400) {
            return api.sendMessage('❌ Maximum reminder time is 24 hours (86400 seconds)!', event.threadID);
        }

        const message = args.slice(1).join(' ');
        
        api.sendMessage(`⏰ Reminder set for ${seconds} seconds!\n📝 Message: ${message}`, event.threadID);

        setTimeout(() => {
            api.sendMessage(`⏰ REMINDER!\n\n📝 ${message}\n\n⏱️ Set ${seconds} seconds ago`, event.threadID);
        }, seconds * 1000);
    }
};
