"use strict";

var utils = require("../utils");
// @NethWs3Dev (fixed by Shourov)

module.exports = function (defaultFuncs, api, ctx) {
  return async function sendTypingIndicatorV2(sendTyping, threadID, callback) {

    // ✅ SAFETY CHECK (সবচেয়ে জরুরি)
    if (!threadID) return;

    let count_req = 0;

    var wsContent = {
      app_id: 2220391788200892,
      payload: JSON.stringify({
        label: 3,
        payload: JSON.stringify({
          thread_key: String(threadID),
          is_group_thread: +(String(threadID).length >= 16),
          is_typing: +sendTyping,
          attribution: 0
        }),
        version: 5849951561777440
      }),
      request_id: ++count_req,
      type: 4
    };

    await new Promise((resolve, reject) =>
      ctx.mqttClient.publish(
        "/ls_req",
        JSON.stringify(wsContent),
        {},
        (err, _packet) => (err ? reject(err) : resolve())
      )
    );
  };
};