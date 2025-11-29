module.exports = {
    config: { name: 'command', aliases: ['cmd', 'commands'], role: 0, description: 'List all commands' },
    run: async ({ api, event, commands, config }) => {
        const uniqueCmds = new Set();
        for (const [name, cmd] of commands) {
            uniqueCmds.add(cmd.config.name);
        }
        
        api.sendMessage(`📋 All Commands\n\nTotal: ${uniqueCmds.size}\n\nType ${config.prefix}help for details`, event.threadID);
    }
};
