const fs = require("fs");
const request = require("request");

module.exports.config = {
  name: "sendmsg",
  version: "1.0.0",
  permission: 2,
  prefix: true,
  credits: "Fixer by Shourov",
  description: "Broadcast message to all threads + reply bridge",
  category: "admin",
  usages: "sendmsg your message",
  cooldowns: 5,
};

// Temporary storage for attachments
let atmDir = [];

/* ========== ATTACHMENT DOWNLOADER ========== */
const getAtm = (atm, body) => new Promise(async (resolve) => {
  let msg = { body }, attachment = [];

  for (let file of atm) {
    await new Promise(async (done) => {
      try {
        let res = await request.get(file.url);
        let ext = res.uri.pathname.split('.').pop();
        let filePath = __dirname + `/cache/sendmsg_${Date.now()}.${ext}`;

        res.pipe(fs.createWriteStream(filePath)).on("close", () => {
          attachment.push(fs.createReadStream(filePath));
          atmDir.push(filePath);
          done();
        });
      } catch (e) {
        console.log("[Attachment Error]", e);
        done();
      }
    });
  }

  msg.attachment = attachment;
  resolve(msg);
});

/* ========== HANDLE REPLY BRIDGE ========== */
module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  Users,
  Threads
}) {
  const { threadID, messageID, body } = event;
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Dhaka").format("DD/MM/YYYY - HH:mm:ss");
  let username = await Users.getNameUser(event.senderID);

  switch (handleReply.type) {
    /* ---------- USER REPLYING TO ADMIN ---------- */
    case "sendnoti": {
      let content =
        `====== [ USER REPLIED ] ======\n` +
        `⏰ Time: ${time}\n` +
        `👤 User: ${username}\n` +
        `💬 Message: ${body}\n` +
        `🏠 From Group: ${(await Threads.getInfo(threadID))?.threadName || "Unknown"}`;

      if (event.attachments.length > 0) {
        content = await getAtm(event.attachments, content);
      }

      api.sendMessage(content, handleReply.adminThread, (err, info) => {
        atmDir.forEach(f => fs.unlinkSync(f));
        atmDir = [];

        global.client.handleReply.push({
          name: module.exports.config.name,
          type: "adminReply",
          messageID: info.messageID,
          userThread: threadID
        });
      });
      break;
    }

    /* ---------- ADMIN REPLY BACK TO USER ---------- */
    case "adminReply": {
      let content =
        `====== [ ADMIN MESSAGE ] ======\n` +
        `⏰ Time: ${time}\n` +
        `👤 Admin: ${username}\n` +
        `💬 Message: ${body}\n` +
        `Reply here to continue!`;

      if (event.attachments.length > 0) {
        content = await getAtm(event.attachments, content);
      }

      api.sendMessage(content, handleReply.userThread, () => {
        atmDir.forEach(f => fs.unlinkSync(f));
        atmDir = [];
      });
      break;
    }
  }
};

/* ========== MAIN COMMAND ========== */
module.exports.run = async function ({ api, event, args, Users }) {
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Dhaka").format("DD/MM/YYYY - HH:mm:ss");

  const { threadID, senderID, type, messageReply } = event;

  if (!args[0]) return api.sendMessage("❗ Please type a message to broadcast.", threadID);

  const adminName = await Users.getNameUser(senderID);
  const allThreads = global.data.allThreadID || [];

  let message =
    `====== [ ADMIN ANNOUNCEMENT ] ======\n` +
    `⏰ Time: ${time}\n` +
    `👤 Admin: ${adminName}\n` +
    `💬 Message: ${args.join(" ")}\n` +
    `Reply to this message to respond.`;

  if (type === "message_reply" && messageReply.attachments.length > 0) {
    message = await getAtm(messageReply.attachments, message);
  }

  let success = 0,
    failed = 0;

  for (let tid of allThreads) {
    try {
      api.sendMessage(message, tid, (err, info) => {
        if (err) {
          failed++;
        } else {
          success++;
          global.client.handleReply.push({
            name: module.exports.config.name,
            type: "sendnoti",
            messageID: info.messageID,
            adminThread: threadID
          });
        }
      });
    } catch {
      failed++;
    }
  }

  return api.sendMessage(
    `📨 Broadcast completed!\n✔ Sent: ${success}\n❌ Failed: ${failed}`,
    threadID
  );
};