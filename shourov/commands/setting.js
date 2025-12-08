/**
 * settings.js
 * Cleaned / fixed version
 */

module.exports.config = {
  name: "settings",
  version: "1.0.1",
  permission: 2,
  credits: "shourov",
  description: "",
  prefix: true,
  category: "admin",
  usages: "",
  cooldowns: 10,
};

const fs = require("fs-extra");
const path = require("path");
const request = require("request");
const moment = require("moment-timezone");

const cacheDir = path.resolve(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const totalPath = path.resolve(__dirname, "cache", "totalChat.json");
const dataPath = path.resolve(__dirname, "cache", "data.json");
const boxImagePath = path.resolve(__dirname, "cache", "box.png");
const _24hours = 86400000;

function handleByte(byte) {
  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let i = 0;
  let usage = parseInt(byte, 10) || 0;
  while (usage >= 1024 && ++i) usage = usage / 1024;
  return usage.toFixed(usage < 10 && i > 0 ? 1 : 0) + " " + units[i];
}

function handleOS(ping) {
  try {
    const os = require("os");
    const cpus = os.cpus();
    if (!cpus || !cpus.length) return "";
    const model = cpus[0].model || "";
    const speed = cpus[0].speed || "";
    return `📌 Ping: ${Date.now() - ping}ms.\nCPU: ${model} @ ${speed}MHz\n\n`;
  } catch (e) {
    return `📌 Ping: ${Date.now() - ping}ms.\n\n`;
  }
}

// ensure data.json exists and has adminbox object
module.exports.onLoad = function () {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ adminbox: {} }, null, 4));
  } else {
    const data = fs.readJSONSync(dataPath);
    if (!data.hasOwnProperty("adminbox")) data.adminbox = {};
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
  }

  if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
};

module.exports.run = async function ({ api, event, Threads }) {
  const { threadID } = event;
  const menu = `========
[1] Reboot the BOT system
[2] Reload config
[3] Update box data
[4] Update user data
[5] Log out of Facebook account
========
[6] Toggle admin-only mode for this box
[7] Toggle forbid new members entering box
[8] Toggle anti-robbery (guard) mode
[9] Toggle antiout mode
[10] Kick Facebook users (no-UID users)
=========
[11] View information about BOT
[12] View box information
[13] View list of group admins
[14] View Admin list
[15] View group list
-----------
👉 Reply to this message with the option number you choose`;

  return api.sendMessage(
    { body: menu },
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        type: "choose",
      });
    },
    event.messageID
  );
};

module.exports.handleReply = async function ({ api, event, handleReply, Threads, Users }) {
  try {
    const { threadID, messageID, senderID, body } = event;
    const chosen = (body || "").trim();
    const admins = global.config && global.config.ADMINBOT ? global.config.ADMINBOT : [];

    // only allow the author of menu to respond (optional)
    if (handleReply.author && handleReply.author != senderID) {
      // allow admin override (owner)
      // continue — we check specific permissions per-action below
    }

    switch (handleReply.type) {
      case "choose": {
        switch (chosen) {
          case "1": {
            // reboot
            if (!admins.includes(senderID)) return api.sendMessage("Permission denied.", threadID, messageID);
            api.sendMessage("《Restarting...》", threadID, () => process.exit(1));
            break;
          }

          case "2": {
            // reload config
            if (!admins.includes(senderID)) return api.sendMessage("Permission denied.", threadID, messageID);
            try {
              // reload config from client's configPath if available
              if (global.client && global.client.configPath) {
                delete require.cache[require.resolve(global.client.configPath)];
                global.config = require(global.client.configPath);
                return api.sendMessage("Successfully reloaded config.json", threadID, messageID);
              } else {
                return api.sendMessage("Config path not available.", threadID, messageID);
              }
            } catch (e) {
              return api.sendMessage("Reload failed: " + e.message, threadID, messageID);
            }
          }

          case "3": {
            // update box data
            if (!admins.includes(senderID)) return api.sendMessage("Permission denied.", threadID, messageID);
            try {
              const inbox = await api.getThreadList(100, null, ["INBOX"]);
              const list = Array.from(inbox).filter((g) => g.isSubscribed && g.isGroup);
              let updated = 0;
              for (const g of list) {
                const threadInfo = await api.getThreadInfo(g.threadID);
                await Threads.setData(g.threadID, { threadInfo });
                updated++;
                console.log(`Updated box data ID: ${g.threadID}`);
              }
              return api.sendMessage(`Updated data for ${updated} boxes`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error updating boxes: " + e.message, threadID, messageID);
            }
          }

          case "4": {
            // update user data
            if (!admins.includes(senderID)) return api.sendMessage("Permission denied.", threadID, messageID);
            try {
              const inbox = await api.getThreadList(100, null, ["INBOX"]);
              const list = Array.from(inbox).filter((g) => g.isSubscribed && g.isGroup);
              let count = 0;
              for (const g of list) {
                const info = await Threads.getInfo(g.threadID);
                const participantIDs = (info && info.participantIDs) || [];
                for (const id of participantIDs) {
                  try {
                    const userInfo = await api.getUserInfo(id);
                    const name = userInfo && userInfo[id] && userInfo[id].name ? userInfo[id].name : "";
                    await Users.setData(id, { name: name });
                    count++;
                    console.log(`Updated user data ID: ${id}`);
                  } catch (errInner) {
                    // skip
                  }
                }
              }
              return api.sendMessage(`Successfully updated ${count} users' data!`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error updating users: " + e.message, threadID, messageID);
            }
          }

          case "5": {
            // logout
            if (!admins.includes(senderID)) return api.sendMessage("Permission denied.", threadID, messageID);
            api.sendMessage("Logging out of Facebook...", threadID, messageID);
            try {
              api.logout();
            } catch (e) {
              // ignore
            }
            break;
          }

          case "6": {
            // toggle admin-only mode per box
            try {
              const db = fs.readJSONSync(dataPath);
              if (!db.adminbox) db.adminbox = {};
              db.adminbox[threadID] = !db.adminbox[threadID];
              fs.writeFileSync(dataPath, JSON.stringify(db, null, 4));
              const status = db.adminbox[threadID] ? "enabled (only admins can use bot)" : "disabled (everyone can use bot)";
              return api.sendMessage(`✅ Admin-only mode is now: ${status}`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error toggling admin mode: " + e.message, threadID, messageID);
            }
          }

          case "7": {
            // forbid new members entering (toggle newMember in thread data)
            try {
              const info = await api.getThreadInfo(threadID);
              if (!info.adminIDs.some((a) => a.id == api.getCurrentUserID()))
                return api.sendMessage("Bot needs admin permissions in the group.", threadID, messageID);

              const threadData = (await Threads.getData(threadID)).data || {};
              threadData.newMember = !(threadData.newMember === true);
              await Threads.setData(threadID, { data: threadData });
              global.data.threadData.set(parseInt(threadID), threadData);
              return api.sendMessage(`New-member forbid is now: ${threadData.newMember ? "enabled" : "disabled"}`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "8": {
            // guard toggle (anti-robbery)
            try {
              const info = await api.getThreadInfo(threadID);
              if (!info.adminIDs.some((a) => a.id == api.getCurrentUserID()))
                return api.sendMessage("Bot needs admin permissions in the group.", threadID, messageID);

              const threadData = (await Threads.getData(threadID)).data || {};
              threadData.guard = !(threadData.guard === true);
              await Threads.setData(threadID, { data: threadData });
              global.data.threadData.set(parseInt(threadID), threadData);
              return api.sendMessage(`Guard (anti-robbery) mode is now: ${threadData.guard ? "enabled" : "disabled"}`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "9": {
            // antiout toggle
            try {
              const threadData = (await Threads.getData(threadID)).data || {};
              threadData.antiout = !(threadData.antiout === true);
              await Threads.setData(threadID, { data: threadData });
              global.data.threadData.set(parseInt(threadID), threadData);
              return api.sendMessage(`Antiout is now: ${threadData.antiout ? "enabled" : "disabled"}`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "10": {
            // kick "Facebook users" (users without gender / legacy)
            try {
              const info = await api.getThreadInfo(threadID);
              const userInfo = info.userInfo || {};
              const adminIDs = info.adminIDs.map((a) => a.id).includes(api.getCurrentUserID());

              let arr = [];
              for (const uid in userInfo) {
                if (!userInfo[uid].hasOwnProperty("gender")) arr.push(uid);
              }

              if (arr.length == 0) return api.sendMessage("No Facebook users found in this group.", threadID, messageID);
              api.sendMessage(`Found ${arr.length} Facebook users. Starting filter...`, threadID, messageID);

              if (!adminIDs) return api.sendMessage("Bot is not an admin, cannot remove members.", threadID, messageID);

              let success = 0,
                fail = 0;
              for (const id of arr) {
                try {
                  await new Promise((r) => setTimeout(r, 1000));
                  await api.removeUserFromGroup(parseInt(id), threadID);
                  success++;
                } catch {
                  fail++;
                }
              }
              let resultMsg = `Successfully removed ${success} users.`;
              if (fail) resultMsg += ` Failed to remove ${fail} users.`;
              return api.sendMessage(resultMsg, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "11": {
            // bot info
            try {
              const namebot = global.config && global.config.BOTNAME ? global.config.BOTNAME : "Unknown";
              const PREFIX = global.config && global.config.PREFIX ? global.config.PREFIX : global.config.PREFIX || "";
              const admin = global.config && global.config.ADMINBOT ? global.config.ADMINBOT : [];
              const commands = global.client && global.client.commands ? global.client.commands : new Map();

              const threadSetting = (await Threads.getData(String(threadID))).data || {};
              const prefix = threadSetting.PREFIX || PREFIX;

              const ping = Date.now();
              const uptimeSec = process.uptime();
              const hours = Math.floor(uptimeSec / 3600);
              const minutes = Math.floor((uptimeSec % 3600) / 60);
              const seconds = Math.floor(uptimeSec % 60);
              const serverInfo = handleOS(ping);

              const msg =
                `⏰ Now: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss")}\n` +
                `🤖 Name bot: ${namebot}\n` +
                `⏱ Uptime: ${hours}h ${minutes}m ${seconds}s\n--------------\n` +
                `👨‍👨‍👧‍👦 Total Group: ${global.data && global.data.allThreadID ? global.data.allThreadID.length : 0}\n` +
                `👥 Total Users: ${global.data && global.data.allUserID ? global.data.allUserID.length : 0}\n` +
                `👤 Admin bot: ${admin.length}\n` +
                `📝 Total Commands: ${commands.size}\n--------------\n` +
                `🌟 System Prefix : ${PREFIX}\n` +
                `🥀 Prefix box: ${prefix}\n` +
                `${serverInfo}`;

              return api.sendMessage(msg, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "12": {
            // box info + image
            try {
              if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
              let totalChat = fs.readJSONSync(totalPath);
              const threadInfo = await api.getThreadInfo(threadID);
              const timeByMS = Date.now();

              const sl = threadInfo.messageCount || 0;
              if (!totalChat[threadID]) {
                totalChat[threadID] = { time: timeByMS, count: sl, ytd: 0 };
                fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
              }

              let preCount = totalChat[threadID].count || 0;
              let ytd = totalChat[threadID].ytd || 0;
              let hnay = ytd != 0 ? sl - preCount : "No stats";
              let hqua = ytd != 0 ? ytd : "No stats";

              // gender count
              let male = 0,
                female = 0,
                other = 0;
              for (const uid in threadInfo.userInfo) {
                const g = threadInfo.userInfo[uid].gender;
                if (g === "MALE") male++;
                else if (g === "FEMALE") female++;
                else other++;
              }

              const qtv = threadInfo.adminIDs.length;
              const threadName = threadInfo.threadName;
              const id = threadInfo.threadID;
              const pd = threadInfo.approvalMode === false ? "off" : threadInfo.approvalMode === true ? "on" : "N/A";
              const icon = threadInfo.emoji || "";

              const timeNow = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");

              // download box image if available
              if (threadInfo.imageSrc) {
                await new Promise((resolveDownload, rejectDownload) => {
                  request(threadInfo.imageSrc)
                    .pipe(fs.createWriteStream(boxImagePath))
                    .on("close", resolveDownload)
                    .on("error", rejectDownload);
                });
              }

              const body = `» Box name: ${threadName}\n» ID: ${id}\n» Approval: ${pd}\n» Emoji: ${icon}\n» Info:\n» Total members: ${threadInfo.participantIDs.length}\n» 👨 Male: ${male}\n» 👩 Female: ${female}\n» 🕵️ Admins: ${qtv}\n» 💬 Total messages: ${sl}\n» 📈 Interaction: ${hnay === "No stats" ? "No stats" : hnay}\n🌟 Messages yesterday: ${hqua}\n🌟 Messages today: ${hnay}\n   === 「${timeNow}」 ===`;

              const attachment = fs.existsSync(boxImagePath) ? fs.createReadStream(boxImagePath) : null;
              await api.sendMessage({ body, attachment }, threadID, () => {
                if (fs.existsSync(boxImagePath)) fs.unlinkSync(boxImagePath);
              });
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
            break;
          }

          case "13": {
            // list group admins
            try {
              const threadInfo = await api.getThreadInfo(threadID);
              const adminIds = threadInfo.adminIDs || [];
              let list = "";
              let idx = 1;
              for (const a of adminIds) {
                try {
                  const info = await api.getUserInfo(a.id);
                  const name = info && info[a.id] && info[a.id].name ? info[a.id].name : a.id;
                  list += `${idx++}. ${name}\n`;
                } catch {
                  list += `${idx++}. ${a.id}\n`;
                }
              }
              return api.sendMessage(`Admins (${adminIds.length}):\n${list}`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "14": {
            // admin list from config
            try {
              const listAdmin = global.config && global.config.ADMINBOT ? global.config.ADMINBOT : [];
              const lines = [];
              for (const idAdmin of listAdmin) {
                const name = (await Users.getData(idAdmin)).name || idAdmin;
                lines.push(`» ${name}\nLink: https://fb.me/${idAdmin}`);
              }
              return api.sendMessage(`======〘『ADMIN』〙======\n${lines.join("\n")}\n`, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          case "15": {
            // list groups bot is in
            try {
              const inbox = await api.getThreadList(300, null, ["INBOX"]);
              const list = Array.from(inbox).filter((g) => g.isSubscribed && g.isGroup);
              let abc = "💌 Groups the bot is in 💌\n";
              let i = 0;
              for (const g of list) {
                abc += `${++i}. ${g.name}\nID: ${g.threadID}\n------------------------------\n`;
              }
              return api.sendMessage(abc, threadID, messageID);
            } catch (e) {
              return api.sendMessage("Error: " + e.message, threadID, messageID);
            }
          }

          default:
            return api.sendMessage("Invalid option.", threadID, messageID);
        } // end inner switch
        break;
      } // end case choose
    } // end outer switch
  } catch (e) {
    console.error(e);
  }
};

// handleEvent: update totalChat stats daily
module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (!fs.existsSync(totalPath)) fs.writeFileSync(totalPath, JSON.stringify({}));
    const totalChat = fs.readJSONSync(totalPath);
    if (!totalChat[event.threadID]) return;
    if (Date.now() - totalChat[event.threadID].time > _24hours * 2) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const sl = threadInfo.messageCount || 0;
      totalChat[event.threadID] = {
        time: Date.now() - _24hours,
        count: sl,
        ytd: sl - (totalChat[event.threadID].count || 0),
      };
      fs.writeFileSync(totalPath, JSON.stringify(totalChat, null, 2));
    }
  } catch (e) {
    console.error("handleEvent error:", e);
  }
};