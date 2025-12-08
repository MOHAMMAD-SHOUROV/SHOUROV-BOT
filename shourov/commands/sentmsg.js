// shourov/commands/sendmsg2.js
module.exports.config = {
	name: "sendmsg2",
	version: "1.1.0",
	permission: 2,
	prefix: true,
	credits: " Fixed by Shourov",
	description: "Send message to a user or a thread with reply bridge",
	category: "admin",
	usages: "sendmsg2 user <uid> <msg> | sendmsg2 thread <tid> <msg>",
	cooldowns: 5,
};

const moment = require("moment-timezone");

module.exports.run = async function ({ api, event, args, Users, Threads }) {
	const time = moment.tz("Asia/Dhaka").format("HH:mm:ss");
	const date = moment.tz("Asia/Dhaka").format("DD/MM/YYYY");

	if (!args[0] || !args[1] || !args[2]) {
		return api.sendMessage(
			`❌ Syntax:\n• sendmsg2 user <uid> <msg>\n• sendmsg2 thread <tid> <msg>`,
			event.threadID, event.messageID
		);
	}

	const type = args[0].toLowerCase();
	const id = args[1];
	const message = args.slice(2).join(" ");

	const formatted = 
`📨 *Admin Message*\n━━━━━━━━━━━━━━
🕒 Time: ${time}
📅 Date: ${date}

💬 Message:
${message}
━━━━━━━━━━━━━━`;

	try {
		// send main message
		const sendRes = await api.sendMessage(formatted, id);

		// register handleReply so recipient reply goes back to admin thread
		try {
			global.client.handleReply = Array.isArray(global.client.handleReply) ? global.client.handleReply : [];
			global.client.handleReply.push({
				name: this.config.name,         // module name used to find handleReply
				messageID: sendRes.messageID,  // message id in recipient thread (so if they reply to it we catch)
				author: event.senderID,        // admin who initiated
				originThread: event.threadID,  // where admin sent the command (so replies go back there)
				originMessID: event.messageID, // admin's command message id (optional to reference)
				targetThread: id,              // the recipient thread/user id
				type: "admin_to_target"
			});
		} catch (e) {
			console.warn("handleReply push failed:", e && e.message);
		}

		// confirm to admin
		await api.sendMessage(
			`✅ Sent to ${type === "user" ? "user" : "thread"}: ${id}\nReply from recipient will be forwarded here.`,
			event.threadID, event.messageID
		);
	} catch (err) {
		return api.sendMessage(`❌ Failed to send: ${err.message}`, event.threadID, event.messageID);
	}
};


// handleReply — catches replies TO the forwarded message and relays to admin (and sets up reverse handle)
module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads }) {
	try {
		// Only process if the replier is not the original admin (so recipient -> admin)
		const { messageID, author, originThread, originMessID, targetThread, type } = handleReply;
		const { threadID, messageID: repliedMessageID, senderID, body, attachments } = event;

		// If the stored handleReply author is same as replier, ignore (prevents loops)
		if (String(senderID) === String(author)) return;

		// get sender name
		let senderName = "Unknown";
		try { senderName = (await Users.getData(senderID)).name || await Users.getNameUser(senderID); } catch(e){}

		// Prepare forwarded body (from recipient -> admin)
		let forwardText = 
`📩 *Reply from recipient*\n━━━━━━━━━━━━━━
👤 From: ${senderName}
🆔 ID: ${senderID}
🧭 Thread: ${threadID}
🕒 Time: ${moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY")}

💬 Message:
${body || "(no text)"}
━━━━━━━━━━━━━━
_Reply to this bot message to respond to the user._`;

		// If there are attachments, attempt to forward them as well
		let messageToAdmin = { body: forwardText };

		if (attachments && attachments.length > 0) {
			try {
				// facebook-chat-api provides attachments as url links inside event.attachments
				const atms = [];
				for (const a of attachments) {
					if (a.url) {
						// attach by url (some api versions accept {attachment: fs.createReadStream(path)})
						atms.push({ url: a.url, filename: a.filename || 'file' });
					}
				}
				// if receiver has attachments, include note (full download/attach needs fs and request; keep simple)
				if (atms.length) messageToAdmin.body += `\n\n(Attachments were included — reply in bot to send attachments back)`;
			} catch (e) {
				console.warn("attachment handling:", e && e.message);
			}
		}

		// send to admin's origin thread
		const info = await api.sendMessage(messageToAdmin, originThread);

		// register a reverse handleReply so admin can reply back to the recipient easily
		try {
			global.client.handleReply = Array.isArray(global.client.handleReply) ? global.client.handleReply : [];
			global.client.handleReply.push({
				name: this.config.name,
				messageID: info.messageID,    // message in admin thread (so if admin replies to it we catch)
				author: originThread,         // use originThread as marker — but more importantly we'll store target info
				originThread: originThread,
				targetThread: threadID,       // where original reply came from
				targetSender: senderID,       // exact user id if needed
				type: "admin_reply_to_target"
			});
		} catch (e) {
			console.warn("reverse handleReply push failed:", e && e.message);
		}

	} catch (err) {
		console.error("handleReply error:", err && err.stack ? err.stack : err);
	}
};


// Additionally: when admin replies to the forwarded message (type == admin_reply_to_target), relay to the target
// The loader will call this same handleReply with the stored entry: we must detect type "admin_reply_to_target"
module.exports.handleReply = async functionWrapper(orig) {
	// we wrap original to allow two behavior branches. But some loaders expect single function; so we implement inside.
	return async function (ctx) {
		// ctx.handleReply is the stored entry
		const hr = ctx.handleReply;
		const event = ctx.event;
		const api = ctx.api;
		const Users = ctx.Users;
		const Threads = ctx.Threads;

		try {
			// branch A: recipient replied -> we already handled above in previous exported handleReply (kept for compatibility)
			if (hr.type === "admin_to_target" && hr.targetThread) {
				// recipient replied: forward to admin (same as earlier implementation)
				// reuse code above by calling existing exported handleReply logic if needed
				// For simplicity call the previous logic block:
				// (we'll reuse the top-level exported function body by invoking orig)
				return await orig({ api, event, handleReply: hr, Users, Threads });
			}

			// branch B: admin replied to the forwarded message (we should send that reply to the target)
			if (hr.type === "admin_reply_to_target" && hr.targetThread) {
				// Admin replied in originThread and event contains the message body (their reply)
				const adminReplyText = event.body || "";
				const adminName = (await Users.getData(event.senderID)).name || await Users.getNameUser(event.senderID);

				const outText =
`✉️ *Reply from Admin*\n━━━━━━━━━━━━━━
👤 Admin: ${adminName}
🆔 AdminThread: ${hr.originThread}
🕒 Time: ${moment.tz("Asia/Dhaka").format("HH:mm:ss DD/MM/YYYY")}

💬 Message:
${adminReplyText}
━━━━━━━━━━━━━━`;

				// send to target (can be user or thread)
				await api.sendMessage(outText, hr.targetThread);

				// confirm to admin
				await api.sendMessage(`✅ Your reply was sent to the recipient (ID: ${hr.targetThread}).`, hr.originThread);
				return;
			}

			// fallback: just try original
			return await orig({ api, event, handleReply: hr, Users, Threads });
		} catch (e) {
			console.error("sendmsg2 handleReply wrapper error:", e && e.stack ? e.stack : e);
		}
	};
}(module.exports.handleReply);