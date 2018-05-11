const Discord = require("discord.js");

module.exports = {
  title: "auto",
  perms: "Moderator",
  commands: [
    "!Auto",
    "!Auto Add <Words to trigger>:<Response from the bot>",
    "!Auto Remove <ID>"
  ],
  description: [
    "Checks all the auto responses registered in the bot",
    "Adds an auto response to the bot",
    "Remove an auto response. ID findable in `!Auto` command"
  ],

  run: async (client, serverInfo, sql, message, args, AutoResponds) => {
    if (
      hasRole(message.member, "Moderator") ||
      hasRole(message.member, "Admin") ||
      hasRole(message.member, "Developer")
    ) {
      if (args.length == 1) {
        sql.all("Select * from AutoResponds").then(rows => {
          if (rows.length != 0) {
            StatusMSG = "";
            rows.forEach(row => {
              StatusMSG +=
                row.ID + ": " + row.Word + " -> " + row.Response + "\n";
            });
          } else {
            StatusMSG = "No statuses found.";
          }

          const embed = new Discord.RichEmbed()
            .setColor([255, 255, 0])
            .setAuthor("Bot AutoResponds", serverInfo.logo)
            .setDescription(StatusMSG);
          message.channel.send(embed);
        });
      } else if (args[1] == "add") {
        if (message.content.includes(":")) {
          messageSplit = TrimColon(message.content.substring(10)).split(":");
          words = messageSplit[0].trim();
          response = messageSplit[1].trim();

          sql.run(
            `insert into AutoResponds(Word, Response) VALUES ('${mysql_real_escape_string(
              words
            )}', '${mysql_real_escape_string(response)}')`
          );

          const embed = new Discord.RichEmbed()
            .setColor([255, 255, 0])
            .setAuthor("Auto Response message added.", serverInfo.logo);
          message.channel.send(embed);

          AutoResponds.clear();
          sql.all("Select * from AutoResponds").then(rows => {
            rows.forEach(row => {
              AutoResponds.set(row.Word, row.Response);
            });
          });
        } else {
          const embed = new Discord.RichEmbed()
            .setColor([255, 255, 0])
            .setAuthor("Auto Response message was not added.", serverInfo.logo)
            .setDescription(
              "I can't find the `:` to seperate the words to mention and what to respond"
            );
          message.channel.send(embed);
        }
      } else if (args[1] == "remove") {
        if (args.length == 3) {
          sql.run(`delete from AutoResponds where ID = '${args[2]}'`);

          const embed = new Discord.RichEmbed()
            .setColor([255, 255, 0])
            .setAuthor("Auto Response message removed.", serverInfo.logo);
          message.channel.send(embed);

          AutoResponds.clear();
          sql.all("Select * from AutoResponds").then(rows => {
            rows.forEach(row => {
              AutoResponds.set(row.Word, row.Response);
            });
          });
        } else {
          const embed = new Discord.RichEmbed()
            .setColor([255, 255, 0])
            .setAuthor(
              "Please provide the ID of the auto respond message.",
              serverInfo.logo
            );
          message.channel.send(embed);
        }
      }
    }
  }
};

//Functions used to check if a player has the desired role
function pluck(array) {
  return array.map(function(item) {
    return item["name"];
  });
}
function hasRole(mem, role) {
  if (pluck(mem.roles).includes(role)) {
    return true;
  } else {
    return false;
  }
}

function mysql_real_escape_string(str) {
  return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(char) {
    switch (char) {
      case "\0":
        return "\\0";
      case "\x08":
        return "\\b";
      case "\x09":
        return "\\t";
      case "\x1a":
        return "\\z";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "'":
        return char + char; // prepends a backslash to backslash, percent,
      // and double/single quotes
      default:
        return char
    }
  });
}

function TrimColon(text) {
  return text.toString().replace(/^(.*?):*$/, "$1");
}
