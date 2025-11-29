module.exports = {
    config: {
        name: 'calc',
        aliases: ['calculate', 'math'],
        role: 0,
        description: 'Calculate mathematical expressions'
    },
    run: async ({ api, event, args }) => {
        if (args.length === 0) {
            return api.sendMessage('❌ Please provide an expression!\nUsage: /calc <expression>\nExample: /calc 2 + 2 * 5', event.threadID);
        }

        const expression = args.join(' ');
        
        try {
            const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
            
            if (!sanitized) {
                return api.sendMessage('❌ Invalid expression!', event.threadID);
            }

            const result = eval(sanitized);
            
            api.sendMessage(`🔢 Calculator\n\n📝 Expression: ${expression}\n✅ Result: ${result}`, event.threadID);
        } catch (error) {
            api.sendMessage('❌ Invalid mathematical expression!', event.threadID);
        }
    }
};
