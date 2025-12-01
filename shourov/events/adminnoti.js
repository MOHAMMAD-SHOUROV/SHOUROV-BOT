const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "adminNoti",
  eventType: [
    "log:thread-admins",
    "log:user-nickname",
    "log:thread-call",
    "log:thread-icon",
    "log:thread-color",
    "log:link-status",
    "log:magic-words",
    "log:thread-approval-mode",
    "log:thread-poll"
  ],
  version: "1.0.1",
  credits: "Mirai Team (modified)",
  description: "Group log notification"
};

module.exports.run = async function ({ event, api, config, language }) {

  const {
    author,
    threadID,
    logMessageType,
    logMessageData,
    logMessageBody
  } = event;

  // Prevent bot spam reacting on itself
  if (author === threadID) return;

  // Local emoji cache file
  const iconPath = path.join(__dirname, "cache", "emoji.json");
  if (!fs.existsSync(path.dirname(iconPath))) fs.mkdirSync(path.dirname(iconPath), { recursive: true });
  if (!fs.existsSync(iconPath)) fs.writeFileSync(iconPath, JSON.stringify({}));

  const moduleConfig = config?.configModule?.adminNoti || {
    autoUnsend: true,
    sendNoti: true,
    timeToUnsend: 10
  };

  try {

    switch (logMessageType) {

      // ⭐ Admin add/remove
      case "log:thread-admins": {
        const target = logMessageData.TARGET_ID;
        if (logMessageData.ADMIN_EVENT === "add_admin") {
          api.sendMessage(
            `🛡️ GROUP UPDATE\n❯ User ${target} has been promoted to admin.`,
            threadID
          );
        } else {
          api.sendMessage(
            `🛡️ GROUP UPDATE\n❯ Admin role removed from user: ${target}`,
            threadID
          );
        }
        break;
      }

      // ⭐ Nickname update
      case "log:user-nickname": {
        const { participant_id, nickname } = logMessageData;
        api.sendMessage(
          `📝 GROUP UPDATE\n❯ Nickname updated for ${participant_id}\n→ New nickname: ${nickname || "removed"}`,
          threadID
        );
        break;
      }

      // ⭐ Thread Icon
      case "log:thread-icon": {
        let preIcon = JSON.parse(fs.readFileSync(iconPath));
        const newIcon = logMessageData.thread_icon || "👍";

        if (moduleConfig.sendNoti) {
          api.sendMessage(
            `🎭 GROUP ICON UPDATED\n❯ ${logMessageBody.replace("emoji", "icon")}\n❯ Old Icon: ${preIcon[threadID] || "unknown"}`,
            threadID,
            async (err, info) => {
              preIcon[threadID] = newIcon;
              fs.writeFileSync(iconPath, JSON.stringify(preIcon));

              // Auto unsend
              if (moduleConfig.autoUnsend) {
                await new Promise(res => setTimeout(res, moduleConfig.timeToUnsend * 1000));
                return api.unsendMessage(info.messageID);
              }
            }
          );
        }
        break;
      }

      // ⭐ Call start/stop/join
      case "log:thread-call": {
        if (logMessageData.event === "group_call_started") {
          api.sendMessage(
            `📞 CALL STARTED\n❯ Call Type: ${logMessageData.video ? "Video" : "Audio"}\n❯ Caller: ${logMessageData.caller_id}`,
            threadID
          );
        }

        else if (logMessageData.event === "group_call_ended") {
          const sec = logMessageData.call_duration;
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = sec % 60;

          api.sendMessage(
            `📴 CALL ENDED\n❯ Duration: ${h}h ${m}m ${s}s`,
            threadID
          );
        }

        else if (logMessageData.joining_user) {
          api.sendMessage(
            `👥 CALL JOINED\n❯ ${logMessageData.joining_user} joined the call.`,
            threadID
          );
        }

        break;
      }

      // ⭐ Invite link on/off
      case "log:link-status": {
        api.sendMessage(logMessageBody, threadID);
        break;
      }

      // ⭐ Magic words
      case "log:magic-words": {
        api.sendMessage(
          `✨ MAGIC WORD UPDATE\n❯ ${logMessageData.magic_word}\n❯ Theme: ${logMessageData.theme_name}\n❯ Emoji: ${logMessageData.emoji_effect || "None"}`,
          threadID
        );
        break;
      }

      // ⭐ Poll
      case "log:thread-poll": {
        api.sendMessage(logMessageBody, threadID);
        break;
      }

      // ⭐ Approval mode
      case "log:thread-approval-mode": {
        api.sendMessage(logMessageBody, threadID);
        break;
      }

      // ⭐ Thread color
      case "log:thread-color": {
        if (moduleConfig.sendNoti) {
          api.sendMessage(
            `🎨 THREAD COLOR CHANGED\n❯ ${logMessageBody.replace("Theme", "Color")}`,
            threadID,
            async (err, info) => {
              if (moduleConfig.autoUnsend) {
                await new Promise(res => setTimeout(res, moduleConfig.timeToUnsend * 1000));
                return api.unsendMessage(info.messageID);
              }
            }
          );
        }
        break;
      }

    }

  } catch (err) {
    console.error("AdminNoti Error:", err);
  }
};
