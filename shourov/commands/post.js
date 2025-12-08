// post.js
const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "post",
  version: "1.0.1",
  permission: 3,
  credits: "shourov",
  prefix: true,
  description: "create a new post from bot account",
  category: "operator",
  cooldowns: 5
};

function getGUID() {
  var sectionLength = Date.now();
  var id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.floor((sectionLength + Math.random() * 16) % 16);
    sectionLength = Math.floor(sectionLength / 16);
    var _guid = (c == "x" ? r : (r & 7) | 8).toString(16);
    return _guid;
  });
  return id;
}

module.exports.run = async ({ event, api, args }) => {
  const { threadID, messageID, senderID } = event;
  const uuid = getGUID();
  // baseline GraphQL variables
  const formData = {
    input: {
      composer_entry_point: "inline_composer",
      composer_source_surface: "timeline",
      idempotence_token: uuid + "_FEED",
      source: "WWW",
      attachments: [],
      audience: {
        privacy: { allow: [], base_state: "FRIENDS", deny: [], tag_expansion_state: "UNSPECIFIED" }
      },
      message: { ranges: [], text: "" },
      with_tags_ids: [],
      inline_activities: [],
      explicit_place_id: "0",
      text_format_preset_id: "0",
      logging: { composer_session_id: uuid },
      tracking: [null],
      actor_id: api.getCurrentUserID(),
      client_mutation_id: Math.floor(Math.random() * 17)
    },
    displayCommentsFeedbackContext: null,
    feedLocation: "TIMELINE",
    fb_api_req_friendly_name: "ComposerStoryCreateMutation"
  };

  // ask audience
  return api.sendMessage(
    `Choose audience for this post:\n1. Everyone\n2. Friends\n3. Only me`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        formData,
        type: "whoSee"
      });
    },
    messageID
  );
};

module.exports.handleReply = async ({ event, api, handleReply }) => {
  try {
    const { type, author } = handleReply;
    if (event.senderID != author) return;
    const { threadID, messageID, senderID, attachments, body } = event;

    const botID = api.getCurrentUserID();

    async function uploadAttachmentsLocalStreams(streams) {
      // upload photos to facebook profile upload endpoint (used by this script previously)
      const uploads = [];
      for (const st of streams) {
        try {
          const form = { file: st };
          // This endpoint historically used in similar bots; returns JSON payload in many setups.
          uploads.push(api.httpPostFormData(`https://www.facebook.com/profile/picture/upload/?profile_id=${botID}&photo_source=57&av=${botID}`, form));
        } catch (e) {
          uploads.push(null);
        }
      }
      return Promise.all(uploads);
    }

    if (type === "whoSee") {
      if (!["1", "2", "3"].includes(String(body).trim())) return api.sendMessage("Please choose 1, 2 or 3.", threadID, messageID);
      formData = handleReply.formData || handleReply.formData === undefined ? handleReply.formData : handleReply.formData;
      // fix: body is string
      handleReply.formData.input.audience.privacy.base_state =
        body === "1" ? "EVERYONE" : body === "2" ? "FRIENDS" : "SELF";

      // ask for content
      api.unsendMessage(handleReply.messageID, () => {
        api.sendMessage("Reply to this message with the content text (or reply 0 to leave blank).", threadID, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            formData: handleReply.formData,
            type: "content"
          });
        }, messageID);
      });
    } else if (type === "content") {
      if (event.body && event.body !== "0") handleReply.formData.input.message.text = event.body;
      api.unsendMessage(handleReply.messageID, () => {
        api.sendMessage("Reply to this message with photo(s) to attach (you can send multiple). Reply 0 to skip images.", threadID, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            formData: handleReply.formData,
            type: "image"
          });
        }, messageID);
      });
    } else if (type === "image") {
      // handle attachments if any
      if (event.body !== "0" && attachments && attachments.length > 0) {
        const tempPaths = [];
        const streams = [];

        try {
          // download each photo attachment to temporary file then create stream
          for (const attach of attachments) {
            if (attach.type !== "photo") continue;
            const resp = await axios.get(attach.url, { responseType: "arraybuffer" });
            const tmpName = __dirname + `/cache/post_img_${Date.now()}_${Math.floor(Math.random()*10000)}.jpg`;
            fs.writeFileSync(tmpName, Buffer.from(resp.data));
            tempPaths.push(tmpName);
            streams.push(fs.createReadStream(tmpName));
          }

          // upload streams (may return for(;;); prefix or JSON)
          const uploadResults = await uploadAttachmentsLocalStreams(streams);

          for (let result of uploadResults) {
            if (!result) continue;
            // handle "for (;;);" prefix sometimes present in responses
            if (typeof result === "string" && result.indexOf("for (;;);") === 0) {
              try { result = JSON.parse(result.replace("for (;;);", "")); } catch (e) { result = null; }
            }
            if (result && result.payload && result.payload.fbid) {
              handleReply.formData.input.attachments.push({
                photo: { id: result.payload.fbid.toString() }
              });
            } else if (result && result.payload && result.payload.media && result.payload.media[0] && result.payload.media[0].fbid) {
              // alternative structure
              handleReply.formData.input.attachments.push({
                photo: { id: result.payload.media[0].fbid.toString() }
              });
            } else {
              // fallback: try to parse JSON if string
              try {
                const maybe = typeof result === "string" ? JSON.parse(result) : result;
                if (maybe && maybe.payload && maybe.payload.fbid) {
                  handleReply.formData.input.attachments.push({ photo: { id: maybe.payload.fbid.toString() } });
                }
              } catch (e) { /* ignore */ }
            }
          }
        } catch (err) {
          console.error("Image handling error:", err);
        } finally {
          // cleanup temp files
          for (const p of tempPaths) {
            try { fs.unlinkSync(p); } catch (e) {}
          }
        }
      }

      // All attachments processed — now create the post
      // Prepare GraphQL form (doc_id may vary per FB version; keep the one you used)
      const form = {
        av: botID,
        fb_api_req_friendly_name: "ComposerStoryCreateMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "7711610262190099",
        variables: JSON.stringify(handleReply.formData)
      };

      // submit
      api.httpPost("https://www.facebook.com/api/graphql/", form, (err, info) => {
        // remove the intermediate prompt
        try { api.unsendMessage(handleReply.messageID); } catch (e) {}
        if (err) {
          console.error("GraphQL post error:", err);
          return api.sendMessage("Post creation failed (network). Please try again later.", threadID, messageID);
        }

        // handle "for (;;);" prefix
        if (typeof info === "string" && info.indexOf("for (;;);") === 0) {
          try { info = JSON.parse(info.replace("for (;;);", "")); } catch (e) { /* leave as is */ }
        }

        try {
          if (!info || !info.data || !info.data.story_create || !info.data.story_create.story) {
            throw new Error("invalid response");
          }
          const postData = info.data.story_create.story;
          const postID = postData.legacy_story_hideable_id || (postData.id ? postData.id : null);
          const urlPost = postData.url || null;
          return api.sendMessage(`✅ Post created successfully!\nPost ID: ${postID || "unknown"}\nLink: ${urlPost || "not provided"}`, threadID, messageID);
        } catch (e) {
          console.error("Post parsing error:", e, info);
          return api.sendMessage("Post creation failed, please try again later.", threadID, messageID);
        }
      });
    }
  } catch (e) {
    console.error("handleReply error:", e);
    try { api.sendMessage("An error occurred while handling your reply. See console for details.", event.threadID, event.messageID); } catch (ex) {}
  }
};