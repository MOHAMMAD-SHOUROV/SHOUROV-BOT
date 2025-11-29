module.exports = {
    config: { name: 'commandinstall', aliases: ['install-cmd'], role: 2, description: 'Command installation info' },
    run: async ({ api, event }) => {
        const msg = `
📦 Command Installation

To install new commands:
1. Create .js file in shourov/commands/
2. Follow template: config + run function
3. Restart bot: npm start
4. New command ready!

💡 Read documentation for examples
        `.trim();
        
        api.sendMessage(msg, event.threadID);
    }
};
