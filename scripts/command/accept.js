module.exports.config = {
  name: "accept",
  version: "1.0.0",
  permission: 2,
  credits: "King_Shourov",
  prefix: true,
  description: "Accept or delete friend requests using Facebook UID",
  category: "admin",
  usages: "uid",
  cooldowns: 0
};

module.exports.handleReply = async ({ handleReply, event, api }) => {
  const { author, listRequest } = handleReply;
  if (author != event.senderID) return;
  const args = event.body.replace(/ +/g, " ").toLowerCase().split(" ");
  
  const form = {
    av: api.getCurrentUserID(),
    fb_api_caller_class: "RelayModern",
    variables: {
      input: {
        source: "friends_tab",
        actor_id: api.getCurrentUserID(),
        client_mutation_id: Math.round(Math.random() * 19).toString()
      },
      scale: 3,
      refresh_num: 0
    }
  };
  
  const success = [];
  const failed = [];

  if (args[0] == "add") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else if (args[0] == "del") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  } else {
    return api.sendMessage("❌ Please reply with: add or del followed by number or 'all'", event.threadID, event.messageID);
  }

  let targetIDs = args.slice(1);
  if (args[1] == "all") {
    targetIDs = [];
    const lengthList = listRequest.length;
    for (let i = 1; i <= lengthList; i++) targetIDs.push(i);
  }

  const newTargetIDs = [];
  const promiseFriends = [];

  for (const stt of targetIDs) {
    const u = listRequest[parseInt(stt) - 1];
    if (!u) {
      failed.push(`⚠️ Not found: ${stt}`);
      continue;
    }
    form.variables.input.friend_requester_id = u.node.id;
    form.variables = JSON.stringify(form.variables);
    newTargetIDs.push(u);
    promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
    form.variables = JSON.parse(form.variables);
  }

  for (let i = 0; i < newTargetIDs.length; i++) {
    try {
      const res = await promiseFriends[i];
      if (JSON.parse(res).errors) {
        failed.push(newTargetIDs[i].node.name);
      } else {
        success.push(newTargetIDs[i].node.name);
      }
    } catch (e) {
      failed.push(newTargetIDs[i].node.name);
    }
  }

  api.sendMessage(
    `✅ ${args[0] == "add" ? "Accepted" : "Deleted"} friend requests of ${success.length}:\n${success.join("\n")}` +
    (failed.length > 0 ? `\n\n❌ Failed for ${failed.length}:\n${failed.join("\n")}` : ""),
    event.threadID,
    event.messageID
  );
};

module.exports.run = async ({ event, api }) => {
  const moment = require("moment-timezone");
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } })
  };

  const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
  const listRequest = JSON.parse(res).data.viewer.friending_possibilities.edges;

  if (!listRequest || listRequest.length === 0) {
    return api.sendMessage("❌ No pending friend requests found.", event.threadID, event.messageID);
  }

  let msg = "📥 Friend Request List:\n";
  let i = 0;
  for (const user of listRequest) {
    i++;
    msg += `\n${i}.\n👤 Name: ${user.node.name}\n🆔 ID: ${user.node.id}\n🔗 Profile: ${user.node.url.replace("www.facebook", "fb")}\n⏰ Time: ${moment(user.time * 1000).tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss")}\n`;
  }

  api.sendMessage(
    `${msg}\n\n📌 Reply this message with: \n👉 add <number> or add all\n👉 del <number> or del all`,
    event.threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        listRequest,
        author: event.senderID
      });
    },
    event.messageID
  );
};
