module.exports.config = {
	name: "uns",
	version: "1.0.6",
	permission: 2,
	credits: "shourov",
	prefix: true,
	description: "unsend a bot message by replying to it",
	category: "admin",
	usages: "reply to a bot message",
	cooldowns: 5
};

module.exports.languages = {
	"vi": {
		"returnCant": "Không thể gỡ tin nhắn của người khác.",
		"missingReply": "Hãy reply tin nhắn cần gỡ.",
		"notBotMessage": "Tin nhắn được reply không phải do bot gửi."
	},
	"en": {
		"returnCant": "Can't unsend a message from another user.",
		"missingReply": "Reply to the message you want to unsend.",
		"notBotMessage": "The replied message was not sent by the bot."
	}
};

module.exports.run = function({ api, event, getText }) {
	// Make sure this is a reply
	if (event.type !== "message_reply") {
		return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
	}

	// messageReply should exist now — extra safety
	const replied = event.messageReply;
	if (!replied || !replied.senderID) {
		return api.sendMessage(getText("missingReply"), event.threadID, event.messageID);
	}

	// Only allow unsending messages that were sent by the bot itself
	const botID = api.getCurrentUserID && api.getCurrentUserID();
	if (String(replied.senderID) !== String(botID)) {
		return api.sendMessage(getText("notBotMessage"), event.threadID, event.messageID);
	}

	// All good — unsend
	return api.unsendMessage(replied.messageID);
};