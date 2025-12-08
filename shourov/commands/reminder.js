'use strict';

module.exports.config = {
	name: "reminder",
	version: "0.0.2",
	permission: 0,
	credits: "shourov",
	prefix: true,
	description: "Set a reminder for yourself",
	category: "with prefix",
	usages: "[time_in_seconds] [text]",
	cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
	const moment = global.nodemodule && global.nodemodule["moment-timezone"] ? global.nodemodule["moment-timezone"] : require("moment-timezone");

	const { threadID, messageID, senderID } = event;

	// protect credits
	if ((this.config.credits) != `ALIHSAN SHOUROV`) {
		return api.sendMessage(`please don't change the credits.`, threadID, messageID);
	}

	if (!args || args.length === 0) {
		return api.sendMessage(`Usage:\n${global.config.PREFIX}reminder [time_in_seconds] [text]\n\nExample:\n${global.config.PREFIX}reminder 60 This bot was made by Shourov\n\nNote:\n- Enter time in seconds. 60 = 1 minute.`, threadID, messageID);
	}

	const timeRaw = args[0];
	if (isNaN(timeRaw) || parseInt(timeRaw) <= 0) {
		return api.sendMessage(`Invalid time. Time must be a positive number (seconds).\n\nExample: ${global.config.PREFIX}reminder 60 Take a break`, threadID, messageID);
	}

	const timeSeconds = parseInt(timeRaw, 10);
	const text = args.slice(1).join(" ").trim();

	// friendly display string
	const display = timeSeconds >= 60 ? `${(timeSeconds / 60)} minute(s)` : `${timeSeconds} second(s)`;

	// notify user that reminder is set
	await api.sendMessage(`✅ I'll remind you after ${display}.`, threadID, messageID);

	// schedule reminder (non-blocking)
	setTimeout(async () => {
		try {
			// try to get thread nicknames to display a nicer mention name
			let displayName = null;
			try {
				const threadInfo = await api.getThreadInfo(threadID);
				if (threadInfo && threadInfo.nicknames && threadInfo.nicknames[senderID]) {
					displayName = threadInfo.nicknames[senderID];
				}
			} catch (e) {
				// ignore and fallback
			}

			// fallback to Users service name
			if (!displayName) {
				try {
					if (typeof Users.getNameUser === "function") {
						displayName = await Users.getNameUser(senderID);
					} else {
						const udata = await Users.getData(senderID) || {};
						displayName = udata.name || `User${String(senderID).slice(-4)}`;
					}
				} catch (e) {
					displayName = `User${String(senderID).slice(-4)}`;
				}
			}

			const timeNow = moment.tz("Asia/Dhaka").format("HH:mm:ss D/MM/YYYY");
			const body = text
				? `${displayName},\n🔔 Reminder: ${text}\n⏰ At: ${timeNow}`
				: `${displayName},\n🔔 Reminder: You asked me to remind you but no message text was provided.\n⏰ At: ${timeNow}`;

			await api.sendMessage({
				body,
				mentions: [{ tag: displayName, id: senderID }]
			}, threadID);
		} catch (err) {
			console.error("Reminder send failed:", err && (err.stack || err.message));
		}
	}, timeSeconds * 1000);
};