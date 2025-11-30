module.exports.config = {
  name: "eval",
  aliases: ["ev", "e"],
  version: "1.0.0",
  permission: 2,
  credits: "SHOUROV",
  prefix: "awto",
  description: "ck code",
  category: "admin",
  usages: "simple code",
  cooldowns: 0
};  


module.exports.run = async function ({ api, args, SHOUROV, event, Threads, Users}) {
  
  function output(msg) {
      if (typeof msg == "number" || typeof msg == "boolean" || typeof msg == "function")
        msg = msg.toString();
      else if (msg instanceof Map) {
        let text = `Map(${msg.size}) `;
        text += JSON.stringify(mapToObj(msg), null, 2);
        msg = text;
      }
      else if (typeof msg == "object")
        msg = JSON.stringify(msg, null, 2);
      else if (typeof msg == "undefined")
        msg = "undefined";
      SHOUROV.reply(msg);
    }
    function out(msg) {
      output(msg);
    }
    function mapToObj(map) {
      const obj = {};
      map.forEach(function (v, k) {
        obj[k] = v;
      });
      return obj;
    }
    const cmd = `
    (async () => {
      try {
        ${args.join(" ")}
      }
      catch(err) {
        console.log("eval command", err);
        SHOUROV.reply(
          "error" +
          (err.stack ?
            removeHomeDir(err.stack) :
            removeHomeDir(JSON.stringify(err, null, 2) || "")
          )
        );
      }
    })()`;
    eval(cmd);
  }
