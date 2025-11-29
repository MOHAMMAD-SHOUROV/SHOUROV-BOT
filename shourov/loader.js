const fs = require('fs');
const path = require('path');

function loadCommands() {
    const commands = new Map();
    const commandsPath = path.join(__dirname, 'commands');

    try {
        const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of files) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.config && command.config.name) {
                    commands.set(command.config.name.toLowerCase(), command);

                    if (command.config.aliases && Array.isArray(command.config.aliases)) {
                        command.config.aliases.forEach(alias => {
                            commands.set(alias.toLowerCase(), command);
                        });
                    }
                }
            } catch (error) {
                console.error(`Error loading command ${file}:`, error.message);
            }
        }

        console.log(
            `Loaded commands: ${Array.from(commands.keys()).filter((key, index, self) => {
                const cmd = commands.get(key);
                return self.indexOf(key) === self.findIndex(k => commands.get(k) === cmd);
            }).join(', ')}`
        );

    } catch (error) {
        console.error('Error loading commands:', error);
    }

    return commands;
}

function loadEvents() {
    const events = [];
    const eventsPath = path.join(__dirname, 'events');

    try {
        const files = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of files) {
            try {
                const event = require(path.join(eventsPath, file));
                if (event.run) {
                    event.name = file.replace('.js', '');
                    events.push(event);
                }
            } catch (error) {
                console.error(`Error loading event ${file}:`, error.message);
            }
        }

        console.log(`Loaded events: ${events.map(e => e.name).join(', ')}`);

    } catch (error) {
        console.error('Error loading events:', error);
    }

    return events;
}

module.exports = { loadCommands, loadEvents };
