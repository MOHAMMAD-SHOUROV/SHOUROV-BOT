module.exports = {
    config: {
        name: 'groupinfo',
        aliases: ['group', 'threadinfo'],
        role: 0,
        description: 'Get group/thread information and analytics'
    },
    run: async ({ api, event }) => {
        try {
            const threadInfo = await api.getThreadInfo(event.threadID);

            const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
            const memberCount = threadInfo.participantIDs.length;

            const groupMessage = `
👥 GROUP INFORMATION

📝 Name: ${threadInfo.threadName || 'Unnamed Group'}
🆔 Thread ID: ${event.threadID}
👤 Members: ${memberCount}
👮 Admins: ${adminIDs.length}
${threadInfo.emoji ? `😀 Emoji: ${threadInfo.emoji}` : ''}
${threadInfo.nicknames ? `📛 Custom Nicknames: ${Object.keys(threadInfo.nicknames).length}` : ''}

📊 STATISTICS:
  Total Messages: ${threadInfo.messageCount || 'N/A'}
  ${threadInfo.isGroup ? '✅ Group Chat' : '💬 Direct Chat'}
  ${threadInfo.approvalMode ? '🔒 Approval Mode: ON' : '🔓 Approval Mode: OFF'}
            `.trim();

            api.sendMessage(groupMessage, event.threadID);
        } catch (error) {
            console.error('GroupInfo error:', error);
            api.sendMessage('❌ Failed to get group information. Make sure this is a group chat.', event.threadID);
        }
    }
};
