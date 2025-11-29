module.exports = {
    config: {
        name: 'help',
        aliases: ['commands', 'menu'],
        role: 0,
        description: 'Display all available commands'
    },
    run: async ({ api, event, commands, config, args }) => {
        if (args.length > 0) {
            const cmdName = args[0].toLowerCase();
            const command = commands.get(cmdName);
            
            if (!command) {
                return api.sendMessage(`❌ Command "${cmdName}" not found.`, event.threadID);
            }

            const roleNames = ['User', 'Admin', 'Owner'];
            const helpMessage = `
📌 Command: ${config.prefix}${command.config.name}
${command.config.aliases?.length ? `🔀 Aliases: ${command.config.aliases.join(', ')}` : ''}
👤 Role: ${roleNames[command.config.role]}
📝 Description: ${command.config.description}
            `.trim();

            return api.sendMessage(helpMessage, event.threadID);
        }

        const commandsByRole = { 0: [], 1: [], 2: [] };
        const uniqueCommands = new Map();

        for (const [name, command] of commands) {
            if (!uniqueCommands.has(command.config.name)) {
                uniqueCommands.set(command.config.name, command);
                commandsByRole[command.config.role].push(command.config.name);
            }
        }

        let helpMessage = `
╔══════════════════════╗
║   ${config.botName}   ║
╚══════════════════════╝

📋 Available Commands:

👥 USER COMMANDS (${commandsByRole[0].length}):
${commandsByRole[0].sort().map(cmd => `  • ${config.prefix}${cmd}`).join('\n')}

${commandsByRole[1].length > 0 ? `👮 ADMIN COMMANDS (${commandsByRole[1].length}):\n${commandsByRole[1].sort().map(cmd => `  • ${config.prefix}${cmd}`).join('\n')}\n` : ''}
${commandsByRole[2].length > 0 ? `👑 OWNER COMMANDS (${commandsByRole[2].length}):\n${commandsByRole[2].sort().map(cmd => `  • ${config.prefix}${cmd}`).join('\n')}\n` : ''}
💡 Type ${config.prefix}help <command> for detailed info
📚 Total: ${uniqueCommands.size} commands

Author: ${config.author}
        `.trim();

        api.sendMessage(helpMessage, event.threadID);
    }
};
