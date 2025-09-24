module.exports.config = {
    name: "banned",
    version: "1.1.0",
    permission: 2,
    credits: "Shourov",
    prefix: false,
    description: "Show and manage banned users or threads",
    category: "admin",
    usages: "[user/thread] [list/unban] [ID]",
    cooldowns: 5,
};

module.exports.run = async function({ api, args, Users, event, Threads }) {
    if (!args[0]) return api.sendMessage("Please type 'user' or 'thread' after the command.", event.threadID, event.messageID);

    // ================= USER =================
    if (args[0] === "user") {
        if (args[1] === "unban") {
            const userId = args[2];
            if (!userId) return api.sendMessage("Please provide user ID to unban.", event.threadID, event.messageID);
            const userData = await Users.getData(userId) || {};
            if (!userData.banned) return api.sendMessage("This user is not banned.", event.threadID, event.messageID);
            userData.banned = false;
            await Users.setData(userId, { data: userData });
            global.data.userBanned.delete(userId);
            return api.sendMessage(`✅ User ${userData.name} (${userId}) has been unbanned.`, event.threadID, event.messageID);
        }

        // list banned users
        const list = global.data.userBanned || [];
        const bannedUsers = [];

        for (let id of list) {
            const dataUser = await Users.getData(id);
            if (dataUser.banned) bannedUsers.push({ id, name: dataUser.name });
        }

        if (!bannedUsers.length) {
            return api.sendMessage("Currently no user is banned.", event.threadID, event.messageID);
        }

        let msg = bannedUsers.map((u, i) => `${i + 1}. Name: ${u.name}\nID: ${u.id}`).join("\n");
        return api.sendMessage("❎ Banned users:\n\n" + msg, event.threadID, event.messageID);
    }

    // ================= THREAD =================
    else if (args[0] === "thread") {
        if (args[1] === "unban") {
            const threadId = args[2];
            if (!threadId) return api.sendMessage("Please provide thread ID to unban.", event.threadID, event.messageID);
            const threadData = await Threads.getData(threadId) || {};
            if (!threadData.banned) return api.sendMessage("This thread is not banned.", event.threadID, event.messageID);
            threadData.banned = false;
            await Threads.setData(threadId, { data: threadData });
            global.data.threadBanned.delete(threadId);
            return api.sendMessage(`✅ Thread (${threadId}) has been unbanned.`, event.threadID, event.messageID);
        }

        // list banned threads
        const list = global.data.threadBanned || [];
        const bannedThreads = [];

        for (let id of list) {
            const dataThread = await Threads.getData(id);
            if (dataThread.banned) bannedThreads.push({ id });
        }

        if (!bannedThreads.length) {
            return api.sendMessage("No thread is currently banned.", event.threadID, event.messageID);
        }

        let msg = "";
        for (let i = 0; i < bannedThreads.length; i++) {
            let threadInfo = await api.getThreadInfo(bannedThreads[i].id);
            msg += `${i + 1}. Name: ${threadInfo.threadName}\nID: ${bannedThreads[i].id}\n`;
        }

        return api.sendMessage("❎ Banned threads:\n\n" + msg, event.threadID, event.messageID);
    }

    else {
        return api.sendMessage("Invalid argument. Use 'user' or 'thread'.", event.threadID, event.messageID);
    }
};
