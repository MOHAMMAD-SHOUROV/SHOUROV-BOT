module.exports = {
    config: { name: 'convert', aliases: ['change', 'transform'], role: 0, description: 'Unit conversion' },
    run: async ({ api, event, args }) => {
        if (args.length < 3) return api.sendMessage('❌ Usage: /convert <value> <from> <to>\nExample: /convert 100 kg lb', event.threadID);
        
        const value = parseFloat(args[0]);
        const msg = `
🔄 Unit Converter

Input: ${value} ${args[1].toUpperCase()}
Output: ~${(value * 2.205).toFixed(2)} ${args[2].toUpperCase()}

💡 Approximation (custom conversion needed)
        `.trim();
        
        api.sendMessage(msg, event.threadID);
    }
};
