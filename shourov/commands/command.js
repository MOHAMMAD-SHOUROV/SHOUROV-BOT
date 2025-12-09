"use strict";

module.exports.config = {
  name: "command",
  version: "1.0.1",
  permission: 2,
  credits: "shourov",
  description: "manage/control all bot modules",
  prefix: true,
  category: "operator",
  usages: "[load/unload/loadAll/unloadAll/info] [command name]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "child_process": "",
    "path": ""
  }
};

const path = require("path");

async function loadCommand({ moduleList = [], threadID, messageID, api }) {
  const logger = (() => {
    try {
      return require(global.client.mainPath + "/shourovc.js");
    } catch {
      return console;
    }
  })();

  // permission: only operator allowed
  try {
    const event = global.event || {};
    const operator = global.config && global.config.OPERATOR ? global.config.OPERATOR : [];
    if (!operator || !operator.includes(String(event.senderID))) {
      return api.sendMessage("Only bot operators can use this command.", threadID, messageID);
    }
  } catch (e) {
    // if cannot check operator, continue (safer to allow) — but normally operator exists
  }

  const { execSync } = global.nodemodule["child_process"] || require("child_process");
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const { join } = global.nodemodule["path"] || require("path");

  const configPath = global.client.configPath;
  const mainPath = global.client.mainPath;

  if (!configPath) return api.sendMessage("Config path not found (global.client.configPath).", threadID, messageID);

  // backup config
  delete require.cache[require.resolve(configPath)];
  let configValue = require(configPath);
  try {
    fs.writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 2), "utf8");
  } catch (e) {
    // ignore write error
  }

  const errorList = [];

  for (const nameModule of moduleList) {
    try {
      const dirModule = path.join(__dirname, nameModule + ".js");
      // clear cache
      try { delete require.cache[require.resolve(dirModule)]; } catch (e) {}

      const command = require(dirModule);

      // basic validation
      if (!command || !command.config || !command.run) throw new Error("Module is malformed (missing config/run)");

      // handle dependencies if present
      if (command.config.dependencies && typeof command.config.dependencies === "object") {
        const packageJson = (() => {
          try {
            return JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json")));
          } catch {
            return { dependencies: {} };
          }
        })();
        const listPackage = packageJson.dependencies || {};
        const listbuiltinModules = require("module").builtinModules || [];

        for (const packageName of Object.keys(command.config.dependencies)) {
          try {
            if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) {
              global.nodemodule[packageName] = require(packageName);
            } else {
              // try relative nodemodules in mainPath/nodemodules/node_modules
              const moduleDir = join(mainPath || process.cwd(), "nodemodules", "node_modules", packageName);
              try {
                global.nodemodule[packageName] = require(moduleDir);
              } catch {
                // attempt to install
                logger.loader ? logger.loader(`Installing package ${packageName} for module ${command.config.name}`, "warn") : console.warn(`Installing ${packageName}`);
                const insPack = { stdio: "inherit", env: process.env, shell: true, cwd: join(mainPath || process.cwd(), "nodemodules") };
                execSync("npm --package-lock false --save install " + packageName, insPack);
                // try require again
                try {
                  if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) {
                    global.nodemodule[packageName] = require(packageName);
                  } else {
                    global.nodemodule[packageName] = require(moduleDir);
                  }
                } catch (errRequire) {
                  throw new Error("Unable to load package " + packageName + " for module " + command.config.name + " - " + errRequire);
                }
              }
            }
          } catch (er) {
            throw er;
          }
        }
        logger.loader && logger.loader("Successfully ensured dependencies for " + command.config.name);
      }

      // envConfig handling (optional)
      if (command.config.envConfig && typeof command.config.envConfig === "object") {
        try {
          global.configModule = global.configModule || {};
          global.configModule[command.config.name] = global.configModule[command.config.name] || {};
          configValue[command.config.name] = configValue[command.config.name] || {};

          for (const [key, value] of Object.entries(command.config.envConfig)) {
            if (typeof configValue[command.config.name][key] !== "undefined") {
              global.configModule[command.config.name][key] = configValue[command.config.name][key];
            } else {
              global.configModule[command.config.name][key] = value || "";
              configValue[command.config.name][key] = value || "";
            }
          }
          logger.loader && logger.loader("Loaded envConfig for " + command.config.name);
        } catch (err) {
          throw new Error("failed to load config module: " + err);
        }
      }

      // onLoad
      if (command.onLoad && typeof command.onLoad === "function") {
        try {
          await command.onLoad({ configValue });
        } catch (err) {
          throw new Error("onLoad failed for " + command.config.name + ": " + err);
        }
      }

      // register event if present
      global.client.eventRegistered = global.client.eventRegistered || [];
      if (command.handleEvent) {
        if (!global.client.eventRegistered.includes(command.config.name)) global.client.eventRegistered.push(command.config.name);
      }

      // if previously disabled, remove from disabled lists
      global.config = global.config || {};
      global.config.commandDisabled = global.config.commandDisabled || [];
      configValue.commandDisabled = configValue.commandDisabled || [];

      const jsName = nameModule + ".js";
      if (configValue.commandDisabled.includes(jsName)) {
        configValue.commandDisabled = configValue.commandDisabled.filter(x => x !== jsName);
      }
      if (global.config.commandDisabled.includes(jsName)) {
        global.config.commandDisabled = global.config.commandDisabled.filter(x => x !== jsName);
      }

      // finally set into global client commands collection
      global.client.commands = global.client.commands || new Map();
      global.client.commands.set(command.config.name, command);

      logger.loader && logger.loader("Loaded command " + command.config.name);
    } catch (error) {
      errorList.push(`${nameModule} reason: ${error && error.stack ? error.stack : error}`);
    }
  } // end for

  // persist config
  try {
    fs.writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
    try { fs.unlinkSync(configPath + ".temp"); } catch {}
  } catch (e) {
    // ignore
  }

  if (errorList.length > 0) {
    api.sendMessage("Modules that had problems loading:\n" + errorList.join("\n\n"), threadID, messageID);
  }

  return api.sendMessage("Loaded " + (moduleList.length - errorList.length) + " module(s).", threadID, messageID);
}

async function unloadModule({ moduleList = [], threadID, messageID, api }) {
  const fs = global.nodemodule["fs-extra"] || require("fs-extra");
  const configPath = global.client.configPath;
  const mainPath = global.client.mainPath;

  if (!configPath) return api.sendMessage("Config path not found (global.client.configPath).", threadID, messageID);

  // backup
  try {
    delete require.cache[require.resolve(configPath)];
  } catch (e) {}
  let configValue = require(configPath);
  try { fs.writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 2), "utf8"); } catch (e) {}

  global.client.commands = global.client.commands || new Map();
  global.client.eventRegistered = global.client.eventRegistered || [];
  global.config = global.config || {};
  global.config.commandDisabled = global.config.commandDisabled || [];
  configValue.commandDisabled = configValue.commandDisabled || [];

  for (const nameModule of moduleList) {
    try {
      // delete from runtime maps
      global.client.commands.delete(nameModule);
      global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);

      const jsName = `${nameModule}.js`;
      if (!configValue.commandDisabled.includes(jsName)) configValue.commandDisabled.push(jsName);
      if (!global.config.commandDisabled.includes(jsName)) global.config.commandDisabled.push(jsName);
    } catch (e) {
      // continue
    }
  }

  try {
    fs.writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
    try { fs.unlinkSync(configPath + ".temp"); } catch (e) {}
  } catch (e) {
    // ignore
  }

  return api.sendMessage(`Unloaded ${moduleList.length} module(s).`, threadID, messageID);
}

module.exports.run = async function ({ event, args, api }) {
  try {
    const { readdirSync } = global.nodemodule["fs-extra"] || require("fs-extra");
    const { threadID, messageID } = event;

    if (!args || args.length === 0) return api.sendMessage("Usage: command [load/unload/loadAll/unloadAll/info] [moduleName]", threadID, messageID);

    let sub = args[0].toLowerCase();
    let moduleList = args.slice(1);

    switch (sub) {
      case "load": {
        if (moduleList.length === 0) return api.sendMessage("Module name cannot be empty.", threadID, messageID);
        return await loadCommand({ moduleList, threadID, messageID, api });
      }
      case "unload": {
        if (moduleList.length === 0) return api.sendMessage("Module name cannot be empty.", threadID, messageID);
        return await unloadModule({ moduleList, threadID, messageID, api });
      }
      case "loadall": {
        moduleList = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes("example")).map(f => f.replace(/\.js$/, ""));
        return await loadCommand({ moduleList, threadID, messageID, api });
      }
      case "unloadall": {
        moduleList = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes("example") && !file.includes("command")).map(f => f.replace(/\.js$/, ""));
        return await unloadModule({ moduleList, threadID, messageID, api });
      }
      case "info": {
        if (moduleList.length === 0) return api.sendMessage("Please provide module name for info.", threadID, messageID);
        const command = global.client.commands.get(moduleList.join("") || "");
        if (!command) return api.sendMessage("The module you entered does not exist.", threadID, messageID);

        const cfg = command.config || {};
        const name = cfg.name || "unknown";
        const version = cfg.version || "unknown";
        const hasPermssion = cfg.hasPermssion || cfg.permission || 0;
        const credits = cfg.credits || "unknown";
        const cooldowns = cfg.cooldowns || cfg.cooldown || 0;
        const dependencies = cfg.dependencies || {};

        return api.sendMessage(
          `${name.toUpperCase()}\n` +
          `coded by : ${credits}\n` +
          `version : ${version}\n` +
          `request permission : ${hasPermssion == 0 ? "user" : hasPermssion == 1 ? "admin" : "bot operator"}\n` +
          `timeout : ${cooldowns} seconds\n` +
          `required packages : ${Object.keys(dependencies).join(", ") || "none"}`,
          threadID,
          messageID
        );
      }
      default: {
        return global.utils && global.utils.throwError ? global.utils.throwError(this.config.name, threadID, messageID) : api.sendMessage("Unknown subcommand.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("command.run error:", err);
    return api.sendMessage("An error occurred while executing command. Check console.", event.threadID, event.messageID);
  }
};