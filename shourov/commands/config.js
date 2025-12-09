"use strict";

const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "config",
  version: "1.0.0",
  permission: 2,
  prefix: false,
  credits: "shourov",
  description: "config bot",
  category: "operator",
  cooldowns: 5
};

module.exports.languages = {
  vi: {},
  en: {}
};

const cookie = process.env['configAppstate'] || "";
const headers = {
  Host: "mbasic.facebook.com",
  "user-agent":
    "Mozilla/5.0 (Linux; Android 11; M2101K7BG Build/RP1A.200720.011;) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/97.0.4692.98 Mobile Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "navigate",
  "sec-fetch-user": "?1",
  "sec-fetch-dest": "document",
  referer: "https://mbasic.facebook.com/?refsrc=deprecated&_rdr",
  "accept-encoding": "gzip, deflate",
  "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  Cookie: cookie
};

/**
 * handleReply
 * This function handles all follow-up replies for the menu options.
 */
module.exports.handleReply = async function ({ api, event, handleReply, getText }) {
  const botID = api.getCurrentUserID();
  const axiosLocal = require("axios");
  const { type, author } = handleReply;
  const { threadID, messageID, senderID } = event;
  let body = (event.body || "").trim();

  if (author != senderID) return; // only the author who opened the menu can reply

  const args = body.split(/\s+/).filter(Boolean);

  const reply = function (msg, callback) {
    if (callback) api.sendMessage(msg, threadID, callback, messageID);
    else api.sendMessage(msg, threadID, messageID);
  };

  try {
    // MENU RESPONSES
    if (type == "menu") {
      if (["01", "1", "02", "2"].includes(args[0])) {
        reply(
          `please reply to this message with ${
            ["01", "1"].includes(args[0]) ? "bio" : "nickname"
          } you want to change to bot or 'delete' if you want to delete ${
            ["01", "1"].includes(args[0]) ? "bio" : "nickname"
          } present`,
          (err, info) => {
            global.client.handleReply.push({
              name: this.config.name,
              messageID: info.messageID,
              author: senderID,
              type: ["01", "1"].includes(args[0]) ? "changeBio" : "changeNickname"
            });
          }
        );
      } else if (["03", "3"].includes(args[0])) {
        const messagePending = await api.getThreadList(500, null, ["PENDING"]);
        const msg = messagePending.reduce(
          (a, b) => (a += `name : ${b.name}\nid : ${b.threadID}\nmessage : ${b.snippet}\n\n`),
          ""
        );
        return reply(`\nbot message waiting list :\n${msg}`);
      } else if (["04", "4"].includes(args[0])) {
        const messagePending = await api.getThreadList(500, null, ["unread"]);
        const msg =
          messagePending.reduce(
            (a, b) =>
              (a += `group name : ${b.name}\ngroup id : ${b.threadID}\nmessage : ${b.snippet}\n\n⎯⎯⎯\n\n`)
          , "") || "there are no messages yet";
        return reply(`\nbot unread message list\n\n${msg}`);
      } else if (["05", "5"].includes(args[0])) {
        const messagePending = await api.getThreadList(500, null, ["OTHER"]);
        const msg =
          messagePending.reduce(
            (a, b) => (a += `name : ${b.name}\nid : ${b.threadID}\nmessage : ${b.snippet}\n\n⎯⎯⎯\n\n`)
          , "") || "there are no messages yet";
        return reply(`\nbot spam message list :\n${msg}`);
      } else if (["06", "6"].includes(args[0])) {
        reply(`reply to this message with a photo or a link of the image you want to change to the bot profile picture`, (err, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "changeAvatar"
          });
        });
      } else if (["07", "7"].includes(args[0])) {
        if (!args[1] || !["on", "off"].includes(args[1])) return reply("please select on or off");
        const form = {
          av: botID,
          variables: JSON.stringify({
            0: {
              is_shielded: args[1] == "on" ? true : false,
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19)
            }
          }),
          doc_id: "1477043292367183"
        };
        api.httpPost("https://www.facebook.com/api/graphql/", form, (err, data) => {
          if (err || (data && JSON.parse(data).errors)) reply("an error occurred, please try again later");
          else reply(`avatar shield already ${args[1] == "on" ? "turned on" : "turned off"} successfully`);
        });
      } else if (["08", "8"].includes(args[0])) {
        return reply(`reply to this message with the id of the person you want to block, you can enter multiple ids separated by a space or a newline`, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "blockUser"
          });
        });
      } else if (["09", "9"].includes(args[0])) {
        return reply(`reply to this message with the id of the person you want to unblock, can enter multiple ids separated by space or newline`, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "unBlockUser"
          });
        });
      } else if (["10"].includes(args[0])) {
        return reply(`reply to this message with the content you want to create a post`, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "createPost"
          });
        });
      } else if (["11"].includes(args[0])) {
        return reply(`respond to this message with the post id you want to delete, you can enter multiple ids separated by a space or a newline`, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "deletePost"
          });
        });
      } else if (["12", "13"].includes(args[0])) {
        return reply(`reply to this message with the postid you want to comment on (post ${args[0] == "12" ? "by user" : "on group"}), can enter multiple ids separated by space or newline`, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "choiceIdCommentPost",
            isGroup: args[0] == "12" ? false : true
          });
        });
      } else if (["14", "15", "16", "17", "18", "19"].includes(args[0])) {
        reply(`reply to this message with the desired post id (can enter multiple ids separated by space/new line).`, (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type:
              args[0] == "14" ? "choiceIdReactionPost" :
              args[0] == "15" ? "addFiends" :
              args[0] == "16" ? "acceptFriendRequest" :
              args[0] == "17" ? "deleteFriendRequest" :
              args[0] == "18" ? "unFriends" : "choiceIdSendMessage"
          });
        });
      } else if (["20"].includes(args[0])) {
        reply('reply to this message with the code you want to create a note', (e, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "noteCode"
          });
        });
      } else if (["21"].includes(args[0])) {
        api.logout((e) => {
          if (e) return reply('an error occurred, please try again later');
          else return reply('successfully logged out');
        });
      }
      return;
    } // end menu

    // CHANGE BIO
    if (type == "changeBio") {
      const bio = body.toLowerCase() == "delete" ? "" : body;
      api.changeBio(bio, false, (err) => {
        if (err) return reply("an error occurred, please try again later");
        else return reply(`already ${!bio ? "deleted bot's profile bio successfully" : `changed bot bio to: ${bio}`}`);
      });
      return;
    }

    // CHANGE NICKNAME
    if (type == "changeNickname") {
      const nickname = body.toLowerCase() == "delete" ? "" : body;
      const res = (await axiosLocal.get("https://mbasic.facebook.com/" + botID + "/about", {
        headers,
        params: {
          nocollections: "1",
          lst: `${botID}:${botID}:${Date.now().toString().slice(0, 10)}`,
          refid: "17"
        }
      })).data;

      // write for debugging if needed
      try {
        await fs.ensureDir(__dirname + "/cache");
        fs.writeFileSync(__dirname + "/cache/resNickname.html", res);
      } catch (e) {
        // ignore write errors
      }

      let form;
      if (nickname) {
        const name_id = res.includes('href="/profile/edit/info/nicknames/?entid=') ? res.split('href="/profile/edit/info/nicknames/?entid=')[1].split("&amp;")[0] : null;
        const variables = {
          collectionToken: Buffer.from("app_collection:" + botID + ":2327158227:206").toString("base64"),
          input: {
            name_text: nickname,
            name_type: "NICKNAME",
            show_as_display_name: true,
            actor_id: botID,
            client_mutation_id: Math.round(Math.random() * 19).toString()
          },
          scale: 3,
          sectionToken: Buffer.from("app_section:" + botID + ":2327158227").toString("base64")
        };
        if (name_id) variables.input.name_id = name_id;

        form = {
          av: botID,
          fb_api_req_friendly_name: "ProfileCometNicknameSaveMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: "4126222767480326",
          variables: JSON.stringify(variables)
        };
      } else {
        if (!res.includes('href="/profile/edit/info/nicknames/?entid=')) return reply("your bot currently has no nicknames");
        const name_id = res.split('href="/profile/edit/info/nicknames/?entid=')[1].split("&amp;")[0];
        form = {
          av: botID,
          fb_api_req_friendly_name: "ProfileCometAboutFieldItemDeleteMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: "4596682787108894",
          variables: JSON.stringify({
            collectionToken: Buffer.from("app_collection:" + botID + ":2327158227:206").toString("base64"),
            input: {
              entid: name_id,
              field_type: "nicknames",
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 3,
            sectionToken: Buffer.from("app_section:" + botID + ":2327158227").toString("base64"),
            isNicknameField: true,
            useDefaultActor: false
          })
        };
      }

      api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
        if (e) return reply("an error occurred, please try again later");
        try {
          const parsed = JSON.parse(i);
          if (parsed.errors) return reply(`an error occurred: ${parsed.errors[0].summary || parsed.errors[0].description}`);
          return reply(`successfully ${!nickname ? "deleted the bot's nickname" : `renamed bot's nickname to: ${nickname}`}`);
        } catch (ex) {
          return reply("unexpected response from facebook (nickname)");
        }
      });
      return;
    }

    // CHANGE AVATAR
    if (type == "changeAvatar") {
      let imgUrl = null;
      if (body && body.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)(\?.*)?$/i)) imgUrl = body;
      else if (event.attachments && event.attachments[0] && event.attachments[0].type == "photo") imgUrl = event.attachments[0].url;
      else if (body && body.match(/^https?:\/\/.+$/i)) imgUrl = body; // accept any link, try fetching

      if (!imgUrl) {
        return reply(`Please enter a valid image link or reply to the message with an image you want to set as an avatar for the bot`, (err, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "changeAvatar"
          });
        });
      }

      try {
        // get image as stream/buffer
        const resp = await axiosLocal.get(imgUrl, { responseType: "arraybuffer", timeout: 20000 });
        const buffer = Buffer.from(resp.data, "binary");

        // upload form
        const form0 = { file: buffer }; // api.httpPostFormData expects this structure in many loaders
        let uploadImageToFb = await api.httpPostFormData(`https://www.facebook.com/profile/picture/upload/?profile_id=${botID}&photo_source=57&av=${botID}`, form0);
        // response comes as JSON string prefixed with for (;;);
        uploadImageToFb = JSON.parse(uploadImageToFb.split("for (;;);")[1]);
        if (uploadImageToFb.error) return reply("an error occurred: " + (uploadImageToFb.error.errorDescription || uploadImageToFb.error));
        const idPhoto = uploadImageToFb.payload.fbid;

        const form = {
          av: botID,
          fb_api_req_friendly_name: "ProfileCometProfilePictureSetMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: "5066134240065849",
          variables: JSON.stringify({
            input: {
              caption: "",
              existing_photo_id: idPhoto,
              expiration_time: null,
              profile_id: botID,
              profile_pic_method: "EXISTING",
              profile_pic_source: "TIMELINE",
              scaled_crop_rect: { height: 1, width: 1, x: 0, y: 0 },
              skip_cropping: true,
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            isPage: false,
            isProfile: true,
            scale: 3
          })
        };

        api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
          if (e) return reply("An error occurred, please try again later");
          try {
            const parsed = JSON.parse(i.slice(0, i.indexOf("\n") + 1));
            if (parsed.errors) return reply(`an error occurred: ${parsed.errors[0].description}`);
            return reply("changed avatar for bot successfully");
          } catch (ex) {
            return reply("Unexpected response from facebook (avatar).");
          }
        });
      } catch (err) {
        return reply("An error occurred, please try again later (fetch/upload).");
      }
      return;
    }

    // BLOCK USERS
    if (type == "blockUser") {
      if (!body) return reply("please enter the uid(s) you want to block (separated by space/newline)", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "blockUser"
        });
      });

      const uids = body.replace(/\s+/g, " ").trim().split(" ");
      const success = [];
      const failed = [];
      for (const uid of uids) {
        try {
          await api.changeBlockedStatus(uid, true);
          success.push(uid);
        } catch (err) {
          failed.push(uid);
        }
      }
      return reply(`successfully blocked ${success.length} users on messenger${failed.length ? `\nBlock failure ${failed.length} id(s): ${failed.join(" ")}` : ""}`);
    }

    // UNBLOCK USERS
    if (type == "unBlockUser") {
      if (!body) return reply("please enter the uid(s) you want to unblock (separated by space/newline)", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "unBlockUser"
        });
      });

      const uids = body.replace(/\s+/g, " ").trim().split(" ");
      const success = [];
      const failed = [];
      for (const uid of uids) {
        try {
          await api.changeBlockedStatus(uid, false);
          success.push(uid);
        } catch (err) {
          failed.push(uid);
        }
      }
      return reply(`unblocked successfully ${success.length} users on messenger${failed.length ? `\nUnblock failure ${failed.length} id(s): ${failed.join(" ")}` : ""}`);
    }

    // CREATE POST
    if (type == "createPost") {
      if (!body) return reply("please enter the content you want to create the post with", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "createPost"
        });
      });

      const session_id = getGUID();
      const form = {
        av: botID,
        fb_api_req_friendly_name: "ComposerStoryCreateMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "4612917415497545",
        variables: JSON.stringify({
          input: {
            composer_entry_point: "inline_composer",
            composer_source_surface: "timeline",
            idempotence_token: session_id + "_FEED",
            source: "WWW",
            attachments: [],
            audience: { privacy: { allow: [], base_state: "EVERYONE", deny: [], tag_expansion_state: "UNSPECIFIED" } },
            message: { ranges: [], text: body },
            with_tags_ids: [],
            explicit_place_id: "0",
            text_format_preset_id: "0",
            logging: { composer_session_id: session_id },
            actor_id: botID,
            client_mutation_id: Math.round(Math.random() * 19)
          },
          displayCommentsFeedbackContext: null,
          feedLocation: "TIMELINE",
          feedbackSource: 0,
          scale: 3,
          useDefaultActor: false,
          isTimeline: true
        })
      };

      api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
        if (e) return reply(`post creation failed, please try again later`);
        try {
          const parsed = JSON.parse(i);
          if (parsed.errors) return reply(`post creation failed: ${parsed.errors[0].summary || parsed.errors[0].description}`);
          const postID = parsed.data.story_create.story.legacy_story_hideable_id;
          const urlPost = parsed.data.story_create.story.url;
          return reply(`post created successfully\npost id : ${postID}\npost link : ${urlPost}`);
        } catch (ex) {
          return reply("Unexpected response from facebook (create post).");
        }
      });
      return;
    }

    // CHOICE ID COMMENT -> then commentPost
    if (type == "choiceIdCommentPost") {
      if (!body) return reply("please enter the id(s) of the post you want to comment on (space separated)", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "choiceIdCommentPost",
          isGroup: handleReply.isGroup
        });
      });
      reply("reply to this message with the comment content", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          postIDs: body.replace(/\s+/g, " ").split(" "),
          type: "commentPost",
          isGroup: handleReply.isGroup
        });
      });
      return;
    }

    // COMMENT POST
    if (type == "commentPost") {
      const { postIDs = [], isGroup = false } = handleReply;
      if (!body) return reply("please enter the comment text", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "commentPost",
          postIDs,
          isGroup
        });
      });

      const success = [];
      const failed = [];

      for (let id of postIDs) {
        const postID = Buffer.from("feedback:" + id).toString("base64");
        const ss1 = getGUID();
        const ss2 = getGUID();
        const form = {
          av: botID,
          fb_api_req_friendly_name: "CometUFICreateCommentMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: "4744517358977326",
          variables: JSON.stringify({
            input: {
              attachments: null,
              feedback_id: postID,
              message: { ranges: [], text: body },
              idempotence_token: "client:" + ss1,
              session_id: ss2,
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19)
            },
            displayCommentsFeedbackContext: null,
            feedLocation: isGroup ? "GROUP" : "TIMELINE",
            scale: 3,
            useDefaultActor: false
          })
        };

        try {
          const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
          if (res && JSON.parse(res).errors) failed.push(id);
          else success.push(id);
        } catch (err) {
          failed.push(id);
        }
      }
      return reply(`successfully commented ${success.length} posts${failed.length ? `\ncomment failed ${failed.length} posts: ${failed.join(" ")}` : ""}`);
    }

    // DELETE POST (uses mbasic scraping + post delete flow)
    if (type == "deletePost") {
      if (!body) return reply("please enter post id(s) separated by space", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "deletePost"
        });
      });
      const postIDs = body.replace(/\s+/g, " ").split(" ");
      const success = [];
      const failed = [];

      for (const postID of postIDs) {
        try {
          let res = (await axiosLocal.get("https://mbasic.facebook.com/story.php?story_fbid=" + postID + "&id=" + botID, { headers })).data;
          const session_ID = decodeURIComponent(res.split('session_id%22%3A%22')[1].split('%22%2C%22')[0]);
          const hideable_token = decodeURIComponent(res.split('%22%2C%22hideable_token%22%3A%')[1].split('%22%2C%22')[0]);
          let URl = 'https://mbasic.facebook.com/nfx/basic/direct_actions/?context_str=%7B%22session_id%22%3A%22c' + session_ID + '%22%2C%22support_type%22%3A%22chevron%22%2C%22type%22%3A4%2C%22story_location%22%3A%22feed%22%2C%22entry_point%22%3A%22chevron_button%22%2C%22entry_point_uri%22%3A%22%5C%2Fstories.php%3Ftab%3Dh_nor%22%2C%22hideable_token%22%3A%22%' + hideable_token + '%22%2C%22story_permalink_token%22%3A%22S%3A_I' + botID + '%3A' + postID + '%22%7D&redirect_uri=%2Fstories.php%3Ftab%3Dh_nor&refid=8&__tn__=%2AW-R';
          res = (await axiosLocal.get(URl, { headers })).data;

          let actionPath = res.split('method="post" action="/nfx/basic/handle_action/?')[1].split('"')[0];
          let actionUrl = "https://mbasic.facebook.com/nfx/basic/handle_action/?" + actionPath.replace(/&amp;/g, '&');
          const fb_dtsg = res.split('type="hidden" name="fb_dtsg" value="')[1].split('" autocomplete="off" /><input')[0];
          const jazoest = res.split('type="hidden" name="jazoest" value="')[1].split('" autocomplete="off" />')[0];

          const data = "fb_dtsg=" + encodeURIComponent(fb_dtsg) + "&jazoest=" + encodeURIComponent(jazoest) + "&action_key=DELETE&submit=G%E1%BB%ADi";
          const dt = await axiosLocal({ url: actionUrl, method: "post", headers, data });
          if (dt.data && dt.data.includes("Sorry, an error has occurred")) throw new Error();
          success.push(postID);
        } catch (err) {
          failed.push(postID);
        }
      }
      return reply(`deleted successfully ${success.length} posts ${failed.length ? `\ndelete failed ${failed.length} posts: ${failed.join(" ")}` : ""}`);
    }

    // CHOICE ID Reaction -> reactionPost
    if (type == "choiceIdReactionPost") {
      if (!body) return reply("please enter post id(s)", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "choiceIdReactionPost"
        });
      });

      const listID = body.replace(/\s+/g, " ").split(" ");
      reply(`enter the emotion you want to react to ${listID.length} posts (unlike/like/love/heart/haha/wow/sad/angry)`, (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          listID,
          type: "reactionPost"
        });
      });
      return;
    }

    // REACTION POST
    if (type == "reactionPost") {
      const postIDs = handleReply.listID || [];
      const feeling = (body || "").toLowerCase();
      if (!["unlike", "like", "love", "heart", "haha", "wow", "sad", "angry"].includes(feeling)) return reply("please choose one of: unlike/like/love/heart/haha/wow/sad/angry");

      const success = [];
      const failed = [];
      for (const postID of postIDs) {
        try {
          await api.setPostReaction(Number(postID), feeling);
          success.push(postID);
        } catch (err) {
          failed.push(postID);
        }
      }
      return reply(`reacted ${feeling} to ${success.length} posts${failed.length ? `\nfailed: ${failed.join(" ")}` : ""}`);
    }

    // ADD FRIENDS by ID
    if (type == "addFiends") {
      const listID = body.replace(/\s+/g, " ").split(" ");
      const success = [];
      const failed = [];
      for (const uid of listID) {
        const form = {
          av: botID,
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "FriendingCometFriendRequestSendMutation",
          doc_id: "5090693304332268",
          variables: JSON.stringify({
            input: {
              friend_requestee_ids: [uid],
              refs: [null],
              source: "profile_button",
              warn_ack_for_ids: [],
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 3
          })
        };
        try {
          const sendAdd = await api.httpPost("https://www.facebook.com/api/graphql/", form);
          if (sendAdd && JSON.parse(sendAdd).errors) failed.push(uid);
          else success.push(uid);
        } catch (e) {
          failed.push(uid);
        }
      }
      return reply(`friend request has been sent successfully to ${success.length} id(s)${failed.length ? `\nfailed: ${failed.join(" ")}` : ""}`);
    }

    // SEND MESSAGE to list
    if (type == "choiceIdSendMessage") {
      const listID = body.replace(/\s+/g, " ").split(" ");
      reply(`Enter the text of the message you want to send to ${listID.length} user(s)`, (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          listID,
          type: "sendMessage"
        });
      });
      return;
    }

    if (type == "sendMessage") {
      const listID = handleReply.listID || [];
      if (!body) return reply("please enter the message text", (e, info) => {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          listID,
          type: "sendMessage"
        });
      });

      const success = [];
      const failed = [];
      for (const uid of listID) {
        try {
          const sendMsg = await api.sendMessage(body, uid);
          if (!sendMsg || !sendMsg.messageID) failed.push(uid);
          else success.push(uid);
        } catch (e) {
          failed.push(uid);
        }
      }
      return reply(`message sent successfully to ${success.length} user(s)${failed.length ? `\nfailed: ${failed.join(" ")}` : ""}`);
    }

    // ACCEPT / DELETE friend requests
    if (type == "acceptFriendRequest" || type == "deleteFriendRequest") {
      const listID = body.replace(/\s+/g, " ").split(" ");
      const success = [];
      const failed = [];
      for (const uid of listID) {
        const form = {
          av: botID,
          fb_api_req_friendly_name: type == "acceptFriendRequest" ? "FriendingCometFriendRequestConfirmMutation" : "FriendingCometFriendRequestDeleteMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: type == "acceptFriendRequest" ? "3147613905362928" : "4108254489275063",
          variables: JSON.stringify({
            input: {
              friend_requester_id: uid,
              source: "friends_tab",
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 3,
            refresh_num: 0
          })
        };
        try {
          const friendRequest = await api.httpPost("https://www.facebook.com/api/graphql/", form);
          if (friendRequest && JSON.parse(friendRequest).errors) failed.push(uid);
          else success.push(uid);
        } catch (e) {
          failed.push(uid);
        }
      }
      return reply(`already ${type == "acceptFriendRequest" ? "accepted" : "deleted"} ${success.length} request(s)${failed.length ? `\nfailed: ${failed.join(" ")}` : ""}`);
    }

    // UNFRIEND
    if (type == "unFriends") {
      const listID = body.replace(/\s+/g, " ").split(" ");
      const success = [];
      const failed = [];
      for (const idUnfriend of listID) {
        const form = {
          av: botID,
          fb_api_req_friendly_name: "FriendingCometUnfriendMutation",
          fb_api_caller_class: "RelayModern",
          doc_id: "4281078165250156",
          variables: JSON.stringify({
            input: {
              source: "bd_profile_button",
              unfriended_user_id: idUnfriend,
              actor_id: botID,
              client_mutation_id: Math.round(Math.random() * 19)
            },
            scale: 3
          })
        };
        try {
          const sendAdd = await api.httpPost("https://www.facebook.com/api/graphql/", form);
          if (sendAdd && JSON.parse(sendAdd).errors) failed.push(`${idUnfriend}: ${JSON.parse(sendAdd).errors[0].summary}`);
          else success.push(idUnfriend);
        } catch (e) {
          failed.push(idUnfriend);
        }
      }
      return reply(`deleted successfully ${success.length} friend(s)${failed.length ? `\nfailed:\n${failed.join("\n")}` : ""}`);
    }

    // NOTE (create code note on buildtool)
    if (type == "noteCode") {
      axiosLocal({
        url: "https://buildtool.dev/verification",
        method: "post",
        data: `content=${encodeURIComponent(body)}&code_class=language${encodeURIComponent("-")}javascript`
      })
        .then(response => {
          const data = response.data || "";
          if (data.includes("Permanent link")) {
            const href = data.split('<a href="code-viewer.php?')[1].split('">Permanent link</a>')[0];
            reply(`Create a successful note, link: ${"https://buildtool.dev/code-viewer.php?" + href}`);
          } else reply("note creation error or unexpected response");
        })
        .catch(err => {
          reply("an error occurred while creating the note, please try again later");
        });
      return;
    }

  } catch (error) {
    console.error("config.handleReply error:", error);
    try {
      api.sendMessage("An unexpected error occurred. Please check the console.", threadID, messageID);
    } catch (e) {}
  }
}; // end handleReply


module.exports.run = async ({ event, api }) => {
  const { threadID, messageID, senderID } = event;

  api.sendMessage(
    "command list\n"
    + "\n01. edit bot bio"
    + "\n02. edit bot nicknames"
    + "\n03. view pending messages"
    + "\n04. view unread messages"
    + "\n05. view spam messages"
    + "\n06. change bot profile picture"
    + "\n07. turn on the bot avatar shield (on/off)"
    + "\n08. block users (messenger)"
    + "\n09. unblock users (messenger)"
    + "\n10. create post"
    + "\n11. delete post"
    + "\n12. delete post (user)"
    + "\n13. comment the post (group)"
    + "\n14. drop post feelings"
    + "\n15. make friends by id"
    + "\n16. accept friend request by id"
    + "\n17. decline friend request by id"
    + "\n18. delete friends by id"
    + "\n19. send a message by id"
    + "\n20. make notes on buildtool.dev"
    + "\n21. log out of your account"
    + `\n\nplease reply to this message with the order number you want to execute`,
    threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "menu"
      });
    },
    messageID
  );
};


/** helpers **/
function getGUID() {
  const key = `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`;
  let timeNow = Date.now();
  return key.replace(/[xy]/g, function (c) {
    const r = (timeNow + Math.random() * 16) % 16 | 0;
    timeNow = Math.floor(timeNow / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}