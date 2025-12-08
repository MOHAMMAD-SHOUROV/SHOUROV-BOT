module.exports.config = {
	name: "pending",
	version: "1.0.6",
	credits: "ryuko | fixed by shourov",
	prefix: false,
	permission: 2,
	description: "approve groups",
	category: "admin",
	cooldowns: 5
};

module.exports.languages = {
    "vi": {
        "invaildNumber": "%1 không phải là một con số hợp lệ",
        "cancelSuccess": "Đã từ chối thành công %1 nhóm!",
        "notiBox": "Box của bạn đã được admin phê duyệt để có thể sử dụng bot",
        "approveSuccess": "Đã phê duyệt thành công %1 nhóm!",
        "cantGetPendingList": "Không thể lấy danh sách các nhóm đang chờ!",
        "returnListPending": "Tổng số nhóm cần duyệt: %1 nhóm\n\n%2",
        "returnListClean": "Hiện tại không có nhóm nào trong hàng chờ!"
    },
    "en": {
        "invaildNumber": "%1 is not a valid number",
        "cancelSuccess": "Successfully refused %1 threads",
        "notiBox": "Your group has been approved, you can now use the bot",
        "approveSuccess": "Approved %1 threads successfully",
        "cantGetPendingList": "Cannot get the pending list",
        "returnListPending": "Total groups waiting for approval: %1\n\n%2",
        "returnListClean": "There is no group in the pending list"
    }
};

module.exports.handleReply = async function({ api, event, handleReply, getText }) {

    if (String(event.senderID) !== String(handleReply.author)) return;

    const { body, threadID, messageID } = event;
    let count = 0;

    // --------- CANCEL SECTION ---------
    if (body.startsWith("c") || body.startsWith("cancel")) {

        const numbers = body.replace(/cancel|c/gi, "").trim().split(/\s+/);

        for (const num of numbers) {
            if (isNaN(num) || num <= 0 || num > handleReply.pending.length)
                return api.sendMessage(getText("invaildNumber", num), threadID, messageID);

            const target = handleReply.pending[num - 1].threadID;

            api.removeUserFromGroup(api.getCurrentUserID(), target);
            count++;
        }

        return api.sendMessage(getText("cancelSuccess", count), threadID, messageID);
    }

    // --------- APPROVE SECTION ---------
    const approveList = body.split(/\s+/);

    for (const num of approveList) {
        if (isNaN(num) || num <= 0 || num > handleReply.pending.length)
            return api.sendMessage(getText("invaildNumber", num), threadID, messageID);

        const target = handleReply.pending[num - 1].threadID;
        api.sendMessage(getText("notiBox"), target);
        count++;
    }

    return api.sendMessage(getText("approveSuccess", count), threadID, messageID);
};


module.exports.run = async function({ api, event, getText }) {

	const { threadID, messageID } = event;

    try {
        var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
        var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
    } catch (e) {
        return api.sendMessage(getText("cantGetPendingList"), threadID, messageID);
    }

    const list = [...spam, ...pending].filter(t => t.isSubscribed && t.isGroup);

    if (list.length === 0)
        return api.sendMessage(getText("returnListClean"), threadID, messageID);

    let msg = "";
    let index = 1;
    for (const item of list)
        msg += `${index++}/ ${item.name} (${item.threadID})\n`;

    return api.sendMessage(
        getText("returnListPending", list.length, msg),
        threadID,
        (err, info) => {
            global.client.handleReply.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: event.senderID,
                pending: list
            });
        },
        messageID
    );
};