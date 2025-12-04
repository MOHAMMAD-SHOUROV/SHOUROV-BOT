module.exports.config = {
	name: "user",
	version: "1.0.6",
	permission: 2,
	credits: "shourov",
	prefix: true,
	description: "ban or unblock users",
	category: "admin",
	usages: "[unban/ban/search] [id or text]",
	cooldowns: 5
};

module.exports.languages = {
	"vi": {
		"reason": "Lý do",
		"at": "vào lúc",
		"allCommand": "toàn bộ lệnh",
		"commandList": "những lệnh",
		"banSuccess": "[ Ban User ] Đã xử lý thành công yêu cầu cấm người dùng: %1",
		"unbanSuccess": "[ Unban User ] Đã xử lý thành công yêu cầu gỡ cấm người dùng %1",
		"banCommandSuccess": "[ banCommand User ] Đã xử lý thành công yêu cầu cấm lệnh đối với người dùng: %1",
		"unbanCommandSuccess": "[ UnbanCommand User ] Đã xử lý thành công yêu cầu gỡ cấm %1 đối với người dùng: %2",
		"errorReponse": "%1 Không thể hoàn tất công việc bạn yêu cầu",
		"IDNotFound": "%1 ID người dùng bạn nhập không tồn tại trong cơ sở dữ liệu",
		"existBan": "[ Ban User ] Người dùng %1 đã bị ban từ trước %2 %3",
		"notExistBan": "[ Unban User ] Người dùng bạn nhập chưa từng bị cấm sử dụng bot",
		"missingCommandInput": "%1 Phần command cần cấm không được để trống!",
		"notExistBanCommand": "[ UnbanCommand User ] Hiện tại ID người dùng bạn nhập chưa từng bị cấm sử dụng lệnh",

		"returnBan": "[ Ban User ] Hiện tại bạn đang yêu cầu cấm người dùng:\n- ID và tên người dùng cần cấm: %1%2\n\n❮ Reaction tin nhắn này để xác thực ❯",
		"returnUnban": "[ Unban User ] Hiện tại bạn đang yêu cầu gỡ cấm người dùng:\n- ID và tên người dùng cần gỡ cấm: %1\n\n❮ Reaction tin nhắn này để xác thực ❯",
		"returnBanCommand": "[ banCommand User ] Hiện tại bạn đang yêu cầu cấm sử dụng lệnh đối với người dùng:\n - ID và tên người dùng cần cấm: %1\n- Các lệnh cần cấm: %2\n\n❮ Reaction tin nhắn này để xác thực ❯",
		"returnUnbanCommand": "[ UnbanCommand User ] Hiện tại bạn đang yêu cầu gỡ cấm sử dụng lệnh đối với với người dùng:\n - ID và tên người dùng cần gỡ cấm lệnh: %1\n- Các lệnh cần gỡ cấm: %2\n\n❮ Reaction tin nhắn này để xác thực ❯",
	
		"returnResult": "Đây là kết quả phù hợp: \n",
		"returnNull": "Không tìm thấy kết quả dựa vào tìm kiếm của bạn!",
		"returnList": "[ User List ]\nHiện tại đang có %1 người dùng bị ban, dưới đây là %2 người dùng\n\n%3",
		"returnInfo": "[ Info User ] Đây là một sô thông tin về người dùng bạn cần tìm:\n- ID và tên của người dùng: %1\n- Có bị ban?: %2 %3 %4\n- Bị ban lệnh?: %5"
	},
	"en": {
		"reason": "reason",
		"at": "at",
		"allCommand": "all commands",
		"commandList": "commands",
		"banSuccess": "banned user : %1",
		"unbanSuccess": "unbanned user %1",
		"banCommandSuccess": "banned command with user : %1",
		"unbanCommandSuccess": "unbanned command %1 with user: %2",
		"errorReponse": "%1 can't do what you request",
		"IDNotFound": "%1 ID you import doesn't exist in database",
		"existBan": "user %1 has been banned before %2 %3",
		"notExistBan": "user hasn't been banned before",
		"missingCommandInput": "%1 you have to import the command you want to ban",
		"notExistBanCommand": "user ID hasn't been banned before",

		"returnBan": "you are requesting to ban user :\nuser id and name who you want to ban : %1%2\n\nreact to this message to complete",
		"returnUnban": "you are requesting to unban user :\nuser id and name who you want to ban : %1\n\nreact to this message to complete",
		"returnBanCommand": "you are requesting to ban command with user :\n - user ID and name who you want to ban : %1\n- commands : %2\n\nreact to this message to complete",
		"returnUnbanCommand": "you are requesting to unban command with user :\nuser id and name : %1\ncommands : %2\n\nreact to this message to complete",
	
		"returnResult": "this is your result : \n",
		"returnNull": "there is no result with your input",
		"returnList": "there are %1 banned user, here are %2 user\n\n%3",
		"returnInfo": "here is some information about the user who you want to find :\nuser id and name : %1\n- banned? : %2 %3 %4\n- command banned? : %5"
	}
}

module.exports.handleReaction = async ({ event, api, Users, handleReaction, getText }) => {
	// only allow author to react
	if (parseInt(event.userID) !== parseInt(handleReaction.author)) return;
	const moment = require("moment-timezone");
	const { threadID } = event;
	const { messageID, type, targetID, reason, commandNeedBan, nameTarget } = handleReaction;
	
	// safe removal from handleReaction array
	try {
		const idx = global.client.handleReaction.findIndex(item => item.messageID == messageID);
		if (idx !== -1) global.client.handleReaction.splice(idx, 1);
	} catch (e) {
		// ignore
	}

	const time = moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss L");

	try {
		switch (type) {
			case "ban": {
				let data = (await Users.getData(targetID)).data || {};
				data.banned = true;
				data.reason = reason || null;
				data.dateAdded = time;
				await Users.setData(targetID, { data });
				global.data.userBanned.set(targetID, { reason: data.reason, dateAdded: data.dateAdded });
				return api.sendMessage(getText("banSuccess", `${targetID} - ${nameTarget}`), threadID, () => {
					return api.unsendMessage(messageID);
				});
			}

			case "unban": {
				let data = (await Users.getData(targetID)).data || {};
				data.banned = false;
				data.reason = null;
				data.dateAdded = null;
				await Users.setData(targetID, { data });
				global.data.userBanned.delete(targetID);
				return api.sendMessage(getText("unbanSuccess", `${targetID} - ${nameTarget}`), threadID, () => {
					return api.unsendMessage(messageID);
				});
			}

			case "banCommand": {
				let data = (await Users.getData(targetID)).data || {};
				data.commandBanned = Array.from(new Set([...(data.commandBanned || []), ...(commandNeedBan || [])]));
				await Users.setData(targetID, { data });
				global.data.commandBanned.set(targetID, data.commandBanned);
				return api.sendMessage(getText("banCommandSuccess", `${targetID} - ${nameTarget}`), threadID, () => {
					return api.unsendMessage(messageID);
				});
			}

			case "unbanCommand": {
				let data = (await Users.getData(targetID)).data || {};
				data.commandBanned = (data.commandBanned || []).filter(item => !((commandNeedBan || []).includes(item)));
				await Users.setData(targetID, { data });
				if (data.commandBanned && data.commandBanned.length > 0) {
					global.data.commandBanned.set(targetID, data.commandBanned);
				} else {
					global.data.commandBanned.delete(targetID);
				}
				const removed = (commandNeedBan && commandNeedBan.length > 0) ? commandNeedBan.join(", ") : getText("allCommand");
				return api.sendMessage(getText("unbanCommandSuccess", removed, `${targetID} - ${nameTarget}`), threadID, () => {
					return api.unsendMessage(messageID);
				});
			}
		}
	} catch (e) {
		console.error("handleReaction error:", e);
		return api.sendMessage(getText("errorReponse", type + " - "), threadID);
	}
}

module.exports.run = async ({ event, api, args, Users, getText }) => {
	const { threadID, messageID } = event;
	const type = (args[0] || "").toString();
	let targetID = args[1] ? String(args[1]).trim() : "";
	let reason = (args.slice(2).join(" ") || null);

	// If targetID isn't numeric, try to get it from mentions
	if (!targetID || isNaN(targetID)) {
		const mentionIds = event.mentions ? Object.keys(event.mentions) : [];
		if (mentionIds.length > 0) {
			targetID = mentionIds[0];
			// try to extract reason after mention text if original args contained mention
			const joinedArgs = args.join(" ");
			const mentionText = event.mentions && event.mentions[targetID] ? event.mentions[targetID] : null;
			if (mentionText) {
				// fallback: keep existing reason (already computed)
			}
		}
	}

	// ensure targetID is a string
	targetID = targetID ? String(targetID) : "";

	switch (type) {
		case "ban":
		case "-b": {
			if (!targetID) return api.sendMessage(getText("IDNotFound", "ban user - "), threadID, messageID);
			if (!global.data.allUserID || !global.data.allUserID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "ban user - "), threadID, messageID);
			
			if (global.data.userBanned && global.data.userBanned.has(targetID)) {
				const { reason: r, dateAdded } = global.data.userBanned.get(targetID) || {};
				return api.sendMessage(getText("existBan", targetID, ((r) ? `${getText("reason")}: "${r}"` : ""), ((dateAdded) ? `${getText("at")} ${dateAdded}` : "")), threadID, messageID);
			}

			const nameTarget = global.data.userName.get(targetID) || await Users.getNameUser(targetID);
			return api.sendMessage(getText("returnBan", `${targetID} - ${nameTarget}`, ((reason) ? `\n- ${getText("reason")}: ${reason}` : "")), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "ban",
					targetID,
					reason,
					nameTarget,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID
				});
			}, messageID);
		}

		case "unban":
		case "-ub": {
			if (!targetID) return api.sendMessage(getText("IDNotFound", "unban user - "), threadID, messageID);
			if (!global.data.allUserID || !global.data.allUserID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "unban user - "), threadID, messageID);
			if (!global.data.userBanned || !global.data.userBanned.has(targetID)) return api.sendMessage(getText("notExistBan"), threadID, messageID);

			const nameTarget = global.data.userName.get(targetID) || await Users.getNameUser(targetID);
			return api.sendMessage(getText("returnUnban", `${targetID} - ${nameTarget}`), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "unban",
					targetID,
					nameTarget,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID
				});
			}, messageID);
		}

		case "search":
		case "-s": {
			const contentJoin = (reason || "").trim();
			const getUsers = (await Users.getAll(['userID', 'name'])).filter(item => !!item.name);
			const matchUsers = [];
			getUsers.forEach(u => {
				if (u.name.toLowerCase().includes(contentJoin.toLowerCase())) matchUsers.push({ name: u.name, id: u.userID });
			});
			if (matchUsers.length > 0) {
				let a = "";
				matchUsers.forEach((i, idx) => a += `\n${idx + 1}. ${i.name} - ${i.id}`);
				return api.sendMessage(getText("returnResult", a), threadID);
			} else {
				return api.sendMessage(getText("returnNull"), threadID);
			}
		}
		
		case "banCommand":
		case "-bc": {
			if (!targetID) return api.sendMessage(getText("IDNotFound", "command ban - "), threadID, messageID);
			if (!global.data.allUserID || !global.data.allUserID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "command ban - "), threadID, messageID);
			if (!reason || reason.length == 0) return api.sendMessage(getText("missingCommandInput", "command ban - "), threadID, messageID);

			// if 'all', ban every command
			if (reason === "all") {
				const allCommandName = Array.from(global.client.commands.keys());
				reason = allCommandName.join(" ");
			}
			const commandNeedBan = reason.split(" ").filter(Boolean);
			const nameTarget = global.data.userName.get(targetID) || await Users.getNameUser(targetID);
			return api.sendMessage(getText("returnBanCommand", `${targetID} - ${nameTarget}`, ((commandNeedBan.length == global.client.commands.size) ? getText("allCommand") : commandNeedBan.join(", "))), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "banCommand",
					targetID,
					commandNeedBan,
					nameTarget,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID
				});
			}, messageID);
		}

		case "unbanCommand":
		case "-ubc": {
			if (!targetID) return api.sendMessage(getText("IDNotFound", "command unban - "), threadID, messageID);
			if (!global.data.allUserID || !global.data.allUserID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "command unban - "), threadID, messageID);
			if (!global.data.commandBanned || !global.data.commandBanned.has(targetID)) return api.sendMessage(getText("notExistBanCommand"), threadID, messageID);
			if (!reason || reason.length == 0) return api.sendMessage(getText("missingCommandInput", "command unban - "), threadID, messageID);

			if (reason === "all") {
				reason = (global.data.commandBanned.get(targetID) || []).join(" ");
			}
			const commandNeedBan = reason.split(" ").filter(Boolean);
			const nameTarget = global.data.userName.get(targetID) || await Users.getNameUser(targetID);
			return api.sendMessage(getText("returnUnbanCommand", `${targetID} - ${nameTarget}`, ((commandNeedBan.length == (global.data.commandBanned.get(targetID) || []).length) ? getText("allCommand") : commandNeedBan.join(", "))), threadID, (error, info) => {
				global.client.handleReaction.push({
					type: "unbanCommand",
					targetID,
					commandNeedBan,
					nameTarget,
					name: this.config.name,
					messageID: info.messageID,
					author: event.senderID
				});
			}, messageID);
		}

		case "list":
		case "-l": {
			// list up to `reason` (number) or default 10
			const limit = parseInt(reason) || 10;
			const listBan = [];
			if (global.data.userBanned && global.data.userBanned.size > 0) {
				let i = 0;
				for (const [id, info] of global.data.userBanned.entries()) {
					if (!id) continue;
					const userName = global.data.userName.get(id) || (await Users.getData(id)).name || "unknown";
					listBan.push(`${++i}/ ${id} - ${userName}`);
					if (i >= limit) break;
				}
			}
			return api.sendMessage(getText("returnList", (global.data.userBanned ? global.data.userBanned.size : 0), listBan.length, listBan.join("\n") || "No banned users"), threadID, messageID);
		}

		case "info":
		case "-i": {
			if (!targetID) return api.sendMessage(getText("IDNotFound", "user info - "), threadID, messageID);
			if (!global.data.allUserID || !global.data.allUserID.includes(targetID)) return api.sendMessage(getText("IDNotFound", "user info - "), threadID, messageID);

			const commandBanned = global.data.commandBanned && global.data.commandBanned.has(targetID) ? (global.data.commandBanned.get(targetID) || []) : null;
			let bannedInfo = null;
			if (global.data.userBanned && global.data.userBanned.has(targetID)) {
				bannedInfo = global.data.userBanned.get(targetID) || {};
			}

			const nameTarget = global.data.userName.get(targetID) || await Users.getNameUser(targetID);
			const isBanned = bannedInfo ? "YES" : "NO";
			const reasonText = bannedInfo && bannedInfo.reason ? `${getText("reason")}: "${bannedInfo.reason}"` : "";
			const atText = bannedInfo && bannedInfo.dateAdded ? `${getText("at")}: ${bannedInfo.dateAdded}` : "";

			const commandBannedText = commandBanned ? `YES: ${(commandBanned.length === global.client.commands.size) ? getText("allCommand") : commandBanned.join(", ")}` : "NO";

			return api.sendMessage(getText("returnInfo", `${targetID} - ${nameTarget}`, isBanned, (reasonText || ""), (atText || ""), commandBannedText), threadID, messageID);
		}

		default:
			return api.sendMessage("Unknown subcommand. Usage: ban/unban/search/banCommand/unbanCommand/list/info", threadID, messageID);
	}
}