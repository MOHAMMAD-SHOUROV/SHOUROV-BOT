module.exports = {
    config: { name: 'choose', aliases: ['pick', 'choice'], role: 0, description: 'Choose between options' },
    run: async ({ api, event, args }) => {
        if (args.length < 2) return api.sendMessage('❌ Usage: /choose <option1> <option2> [option3]...', event.threadID);
        
        const choice = args[Math.floor(Math.random() * args.length)];
        api.sendMessage(`🎲 I choose: ${choice}`, event.threadID);
    }
};
