const path = require("path");

module.exports = {
  run: async ({ event, api, config, language, commands }) => {
    try {
      if (!event) return;

      const threadID = event.threadID || (event.thread_key && event.thread_key.thread_fbid) || event.senderID;
      if (!threadID) return;

      // ---------------- Auto-reply (optional) ----------------
      const autoReply = false; // set true to enable
      if (autoReply && (event.type === "message" || event.type === "message_reply")) {
        try {
          const replyText = "AutoReply: message received ✅";
          if (typeof api.sendMessage === "function") {
            await api.sendMessage({ body: replyText }, threadID);
          } else if (typeof api.send === "function") {
            await api.send({ body: replyText }, threadID);
          }
        } catch (e) {
          console.error("Auto-reply error:", e.message);
        }
      }

      // ---------------- Commands ----------------
      if (!commands || !(commands instanceof Map)) {
        console.warn("Commands map is missing or invalid!");
        return;
      }

      if (event.type === "message" || event.type === "message_reply") {
        const text = (event.body || "").toString().trim();
        if (!text) return;

        // ===== Slash-only redirect: if user sent only "/" (or "/" with spaces), run "islm" =====
        try {
          if (text.replace(/\s+/g, "") === "/") {
            // prefer the commands map passed in; fallback to global if needed
            const cmdMap = (commands instanceof Map) ? commands : (global.client && global.client.commands) ? global.client.commands : null;
            const islmCmd = cmdMap ? cmdMap.get("islm") : null;
            if (islmCmd && typeof islmCmd.run === "function") {
              // run the islm command and stop further processing
              return await islmCmd.run({ event, api, args: [], commands, language });
            }
          }
        } catch (e) {
          console.error('"/" redirect to islm failed:', e && (e.stack || e.message));
          // continue to normal command parsing if redirect fails
        }
        // ===== end slash redirect =====

        const parts = text.split(/\s+/);
        let cmdName = parts[0].toLowerCase();

        // remove common prefixes
        if (cmdName.startsWith("!") || cmdName.startsWith("/")) {
          cmdName = cmdName.slice(1);
        }

        const args = parts.slice(1);

        if (commands.has(cmdName)) {
          const cmd = commands.get(cmdName);
          if (cmd && typeof cmd.run === "function") {
            await cmd.run({ event, api, args, commands, language });
          }
        }
      }

      // ---------------- Mark as seen ----------------
      try {
        if (threadID) {
          if (api.markAsRead) api.markAsRead(threadID, () => {});
          else if (api.setMessageRead) api.setMessageRead(threadID, () => {});
          else if (api.markSeen) api.markSeen(threadID, () => {});
        }
      } catch (e) {
        console.warn("Mark as seen error:", e.message);
      }

    } catch (err) {
      console.error("Message handler error:", err.message);
    }
  }
};
