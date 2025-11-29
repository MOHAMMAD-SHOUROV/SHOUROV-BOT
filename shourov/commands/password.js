module.exports = {
    config: { name: 'password', aliases: ['pwd', 'pass'], role: 0, description: 'Password generator' },
    run: async ({ api, event, args }) => {
        const length = parseInt(args[0]) || 12;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pwd = '';
        for (let i = 0; i < length; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        api.sendMessage(`🔐 Password: ${pwd}`, event.threadID);
    }
};
