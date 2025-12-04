module.exports.config = {
  name: "accept",
  version: "1.1.0",
  permission: 2,
  credits: "King_Shourov",
  prefix: true,
  description: "Accept or delete friend requests using Facebook UID",
  category: "admin",
  usages: "uid",
  cooldowns: 0
};

const moment = require("moment-timezone");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.handleReply = async ({ handleReply, event, api }) => {
  try {
    const { author, listRequest } = handleReply;
    if (String(author) !== String(event.senderID)) return;

    const args = (event.body || "").replace(/ +/g, " ").trim().toLowerCase().split(" ");
    if (!args || !args[0]) {
      return api.sendMessage("❌ Reply with: add <number> / add all  OR  del <number> / del all", event.threadID, event.messageID);
    }

    const action = args[0]; // add | del
    if (action !== "add" && action !== "del") {
      return api.sendMessage("❌ Please reply with: add or del followed by number or 'all'", event.threadID, event.messageID);
    }

    // guard: listRequest must be array
    if (!Array.isArray(listRequest) || listRequest.length === 0) {
      return api.sendMessage("❌ No pending friend requests available anymore.", event.threadID, event.messageID);
    }

    // prepare GraphQL form base
    const baseForm = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 1e6).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    if (action == "add") {
      baseForm.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      baseForm.doc_id = "3147613905362928";
    } else {
      baseForm.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      baseForm.doc_id = "4108254489275063";
    }

    // build target list
    let targetIDs = args.slice(1);
    if (!targetIDs.length) {
      return api.sendMessage("❌ You must specify numbers or 'all'. Example: 'add 1' or 'del all'", event.threadID, event.messageID);
    }

    if (targetIDs[0] === "all") {
      // cap 'all' to a safe limit to avoid accidental mass operations
      const SAFE_MAX = 40;
      const total = Math.min(listRequest.length, SAFE_MAX);
      targetIDs = [];
      for (let i = 1; i <= total; i++) targetIDs.push(String(i));
      if (listRequest.length > SAFE_MAX) {
        api.sendMessage(`⚠️ Found ${listRequest.length} requests — will process first ${SAFE_MAX} only (safety cap).`, event.threadID, event.messageID);
      }
    }

    const success = [];
    const failed = [];

    // build promises sequentially (do not flood)
    for (const stt of targetIDs) {
      const index = parseInt(stt) - 1;
      if (isNaN(index) || index < 0 || index >= listRequest.length) {
        failed.push(`⚠️ Not found: ${stt}`);
        continue;
      }
      const u = listRequest[index];
      if (!u || !u.node || !u.node.id) {
        failed.push(`⚠️ Invalid entry: ${stt}`);
        continue;
      }

      try {
        // prepare form with variables stringified
        const form = {
          ...baseForm,
          variables: JSON.stringify({
            ...baseForm.variables,
            input: {
              ...baseForm.variables.input,
              friend_requester_id: u.node.id
            }
          })
        };

        // call GraphQL endpoint
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        let parsed;
        try { parsed = JSON.parse(res); } catch (e) { parsed = null; }

        if (parsed && parsed.errors) {
          failed.push(u.node.name || `${u.node.id}`);
        } else {
          success.push(u.node.name || `${u.node.id}`);
        }
      } catch (e) {
        failed.push(u.node.name || `${u.node.id}`);
      }

      // small delay to avoid rate limit / look more human
      await sleep(1000 + Math.floor(Math.random() * 800));
    }

    const actionWord = action === "add" ? "Accepted" : "Deleted";
    let out = `✅ ${actionWord} friend requests: ${success.length}\n`;
    if (success.length) out += success.join("\n") + "\n";
    if (failed.length) out += `\n❌ Failed (${failed.length}):\n` + failed.join("\n");

    return api.sendMessage(out, event.threadID, event.messageID);
  } catch (err) {
    console.error("accept.handleReply error:", err);
    return api.sendMessage("An error occurred while processing your reply. Try again later.", event.threadID, event.messageID);
  }
};

module.exports.run = async ({ event, api }) => {
  try {
    const form = {
      av: api.getCurrentUserID(),
      fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
      fb_api_caller_class: "RelayModern",
      doc_id: "4499164963466303",
      variables: JSON.stringify({ input: { scale: 3 } })
    };

    const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
    let parsed;
    try { parsed = JSON.parse(res); } catch (e) { parsed = null; }

    const edges = parsed?.data?.viewer?.friending_possibilities?.edges;
    if (!Array.isArray(edges) || edges.length === 0) {
      return api.sendMessage("❌ No pending friend requests found.", event.threadID, event.messageID);
    }

    let msg = "📥 Friend Request List:\n";
    let i = 0;
    for (const user of edges) {
      i++;
      const name = user?.node?.name || "Unknown";
      const id = user?.node?.id || "Unknown";
      const url = (user?.node?.url || "").replace("www.facebook", "fb") || `https://fb.com/${id}`;
      const timeUnix = user?.time ? Number(user.time) : null;
      const timeStr = timeUnix ? moment(timeUnix * 1000).tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss") : "Unknown";
      msg += `\n${i}.\n👤 Name: ${name}\n🆔 ID: ${id}\n🔗 Profile: ${url}\n⏰ Time: ${timeStr}\n`;
    }

    msg += `\n📌 Reply to this message with:\n👉 add <number>     or add all\n👉 del <number>     or del all\n(Example: reply with 'add 1' to accept the first request)\n\n⚠️ Note: 'all' is capped to avoid accidental mass actions.`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        listRequest: edges,
        author: event.senderID
      });
    }, event.messageID);
  } catch (error) {
    console.error("accept.run error:", error);
    return api.sendMessage("An error occurred while fetching friend requests. Try later.", event.threadID, event.messageID);
  }
};
