module.exports.config = {
	name: "moneys",
	version: "1.0.2",
	permission: 0,
	credits: "shourov",
	prefix: false,
	description: "check the amount of yourself or the person tagged",
	category: "without prefix",
	usages: "[tag]",
	cooldowns: 5
};

module.exports.languages = {
	"vi": {
		"sotienbanthan": "Số tiền bạn đang có: %1$",
		"sotiennguoikhac": "Số tiền của %1 hiện đang có là: %2$"
	},
	"en": {
		"sotienbanthan": "your current balance : %1$",
		"sotiennguoikhac": "%1's current balance : %2$."
	}
}

module.exports.run = async function({ api, event, args, Currencies, getText }) {
	const { threadID, messageID, senderID, mentions } = event;

	// If no args => show sender balance
	if (!args[0]) {
		const data = await Currencies.getData(senderID) || {};
		const money = (typeof data.money !== "undefined" && data.money !== null) ? data.money : 0;
		return api.sendMessage(getText("sotienbanthan", money), threadID, messageID);
	}

	// If exactly one mention => show that user's balance
	const mentionIds = Object.keys(mentions || {});
	if (mentionIds.length === 1) {
		const mentionId = mentionIds[0];
		const data = await Currencies.getData(mentionId) || {};
		const money = (typeof data.money !== "undefined" && data.money !== null) ? data.money : 0;
		const displayName = (typeof mentions[mentionId] === "string" && mentions[mentionId].length) ? mentions[mentionId].replace(/\@/g, "") : "User";
		return api.sendMessage({
			body: getText("sotiennguoikhac", displayName, money),
			mentions: [{
				tag: displayName,
				id: mentionId
			}]
		}, threadID, messageID);
	}

	// Otherwise invalid usage
	return global.utils.throwError(this.config.name, threadID, messageID);
}