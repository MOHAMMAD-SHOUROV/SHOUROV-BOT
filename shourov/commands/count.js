module.exports = {
    config: { name: 'count', aliases: ['counter', 'numbers'], role: 0, description: 'Counting game' },
    run: async ({ api, event, args }) => {
        const max = args.length > 0 ? parseInt(args[0]) : 10;
        let counts = '';
        for (let i = 1; i <= Math.min(max, 50); i++) counts += `${i} `;
        
        api.sendMessage(`🔢 Counting\n\n${counts}\n\n✅ Done!`, event.threadID);
    }
};
