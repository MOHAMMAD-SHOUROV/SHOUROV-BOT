module.exports = {
    config: { name: 'listbox', aliases: ['boxes'], role: 0, description: 'List message boxes' },
    run: async ({ api, event }) => {
        api.sendMessage('📦 Message Boxes\n\nUse /box to manage', event.threadID);
    }
};
