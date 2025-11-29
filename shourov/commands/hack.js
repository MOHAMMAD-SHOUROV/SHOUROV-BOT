module.exports = {
    config: {
        name: 'hack',
        aliases: ['hacking'],
        role: 0,
        description: 'Fun fake hacking simulator'
    },
    run: async ({ api, event, args }) => {
        let target = 'System';
        
        if (Object.keys(event.mentions).length > 0) {
            const targetID = Object.keys(event.mentions)[0];
            const targetName = event.mentions[targetID].replace('@', '');
            target = targetName;
        } else if (args.length > 0) {
            target = args.join(' ');
        }

        const steps = [
            `🔴 Initializing hack sequence...`,
            `🟡 Connecting to ${target}'s mainframe...`,
            `🟢 Access granted!`,
            `📡 Downloading data: 15%...`,
            `📡 Downloading data: 47%...`,
            `📡 Downloading data: 89%...`,
            `✅ Hack complete!`,
            `\n🔓 Successfully hacked ${target}!\n💾 Downloaded: 420.69 GB\n📂 Files: Passwords, Photos, Messages\n🎯 IP: 127.0.0.1\n\n⚠️ Just kidding! This is a joke command 😄`
        ];

        let message = '';
        
        api.sendMessage(steps[0], event.threadID, async (err, info) => {
            for (let i = 1; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                message += steps[i] + '\n';
                
                if (i === steps.length - 1) {
                    api.editMessage(steps[steps.length - 1], info.messageID);
                } else {
                    api.editMessage(message, info.messageID);
                }
            }
        });
    }
};
