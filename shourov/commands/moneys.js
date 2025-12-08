module.exports.config = {
	name: "moneys",
	version: "1.0.2",
	permission: 0,
	credits: "shourov",
	prefix: false,
	description: "check the amount of yourself or tagged user",
	category: "without prefix",
	usages: "[tag]",
	cooldowns: 5
};

module.exports.languages = {
	"en": {
		"sotienbanthan": "your current balance: %1$",
		"sotiennguoikhac": "%1's balance: %2$"
	}
};

module.exports.run = async function({ api, event, args, Currencies, getText }) {
	const { threadID, messageID, senderID, mentions } = event;

	// show self balance
	if (!args[0]) {
		const data = await Currencies.getData(senderID) || {};
		const money = data.money || 0;
		return api.sendMessage(getText("sotienbanthan", money), threadID, messageID);
	}

	// show mentioned user's balance
	const mentionIds = Object.keys(mentions || {});
	if (mentionIds.length === 1) {
		const uid = mentionIds[0];
		const data = await Currencies.getData(uid) || {};
		const money = data.money || 0;
		const name = mentions[uid].replace("@", "");
		return api.sendMessage(
			{
				body: getText("sotiennguoikhac", name, money),
				mentions: [{ id: uid, tag: name }]
			},
			threadID,
			messageID
		);
	}

	// invalid
	return api.sendMessage("invalid usage", threadID, messageID);
};