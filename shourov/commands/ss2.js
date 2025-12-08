// safe-broadcast.js
module.exports.config = {
  name: "ss",
  version: "1.0.1",
  permission: 2,
  credits: "shourov (safe helper)",
  prefix: true,
  description: "Send a limited, rate-limited admin broadcast (use responsibly).",
  category: "admin",
  usages: "bol <count> <delay_ms> <message>",
  cooldowns: 5,
  dependencies: {}
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.run = async function ({ api, event, args, Users }) {
  try {
    const { threadID, senderID, messageID } = event;

    // input validation
    if (!args || args.length < 2) {
      return api.sendMessage(
        "Usage: bol <count 1-50> <delay_ms 200-5000> <message>\nExample: bol 5 1000 Hello everyone!",
        threadID,
        messageID
      );
    }

    const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 50); // clamp 1..50
    const delay = Math.min(Math.max(parseInt(args[1]) || 1000, 200), 5000); // clamp 200..5000 ms
    const msg = args.slice(2).join(" ").trim();

    if (!msg) return api.sendMessage("Please provide the message to send.", threadID, messageID);

    // Safety: disallow obviously abusive words (simple filter — adjust as required)
    const bannedPatterns = [/(\bidiot\b|\bdumba?s?s?\b|\b(nigger|fuck)\b)/i];
    for (const p of bannedPatterns) {
      if (p.test(msg)) {
        return api.sendMessage("Your message contains disallowed words. Edit it and try again.", threadID, messageID);
      }
    }

    // Confirm admin action (simple confirmation mechanism)
    const confirmText = `You are about to send this message ${count} time(s) with ${delay}ms delay:\n\n"${msg}"\n\nReply "yes" to confirm.`;
    const sent = await new Promise(resolve => api.sendMessage(confirmText, threadID, (err, info) => resolve(info)));

    // register a one-time handleReply so admin must reply "yes"
    if (!global.client) global.client = {};
    if (!global.client.handleReply) global.client.handleReply = [];
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: sent.messageID,
      author: senderID,
      type: "confirm_broadcast",
      data: { count, delay, msg }
    });

    return;
  } catch (e) {
    console.error("bol command error:", e);
    return api.sendMessage("An error occurred. Check console for details.", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  try {
    if (!handleReply || handleReply.type !== "confirm_broadcast") return;
    if (event.senderID !== handleReply.author) {
      return api.sendMessage("Only the admin who initiated this broadcast can confirm it.", event.threadID, event.messageID);
    }

    const text = (event.body || "").trim().toLowerCase();
    if (text !== "yes" && text !== "y") {
      return api.sendMessage("Broadcast cancelled.", event.threadID, event.messageID);
    }

    const { count, delay, msg } = handleReply.data;
    await api.sendMessage(`Broadcast starting: will send ${count} message(s) with ${delay}ms delay.`, event.threadID, event.messageID);

    for (let i = 0; i < count; i++) {
      // wrap send in a promise so we wait for send completion or timeout
      await new Promise((resolve) => {
        api.sendMessage(`[${i+1}/${count}] ${msg}`, event.threadID, (err) => {
          if (err) console.warn("sendMessage error:", err);
          resolve();
        });
      });
      if (i < count - 1) await wait(delay);
    }

    return api.sendMessage("Broadcast completed.", event.threadID, event.messageID);
  } catch (err) {
    console.error("handleReply error (bol):", err);
    return api.sendMessage("An error occurred during broadcast.", event.threadID, event.messageID);
  }
};