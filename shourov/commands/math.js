module.exports = {
    config: { name: 'math', aliases: ['calculate', 'calc-v2'], role: 0, description: 'Math calculator' },
    run: async ({ api, event, args }) => {
        if (args.length === 0) return api.sendMessage('❌ Usage: /math 5 + 3', event.threadID);
        try {
            const result = eval(args.join(' '));
            api.sendMessage(`🔢 ${args.join(' ')} = ${result}`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Invalid expression', event.threadID);
        }
    }
};
