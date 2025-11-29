module.exports = {
    config: { name: 'helpall', aliases: ['help-all'], role: 0, description: 'Complete help guide' },
    run: async ({ api, event, config, commands }) => {
        const uniqueCmds = new Set();
        for (const [name, cmd] of commands) {
            uniqueCmds.add(cmd.config.name);
        }
        const msg = `📚 Complete Help\n\n✅ ${uniqueCmds.size} commands available\n\nType ${config.prefix}help <command> for details\n\n💡 Categories:\n• Admin\n• Fun\n• Utility\n• Info\n• Media`;
        api.sendMessage(msg, event.threadID);
    }
};
