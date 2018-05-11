const Discord = require("discord.js");
const keys = require("../tokens.js");

module.exports = {
  title: "checkdb",
  perms: "Support",
  commands: ["!checkdb <@tag>|<steamID>|<discordID>"],
  description: ["Returns the users current status in the database"],

  run: async (client, serverInfo, /* message */ message, args) => {
    if (
      isStaff(message.member) ||
      hasRole(message.member, "Community Helper")
    ) {
      var request = require("request");
      var url = keys.CheckdbURL;
      var user;
      if (args[1] == undefined) {
        message.reply("Need a parameter");
        return;
      } else if (isNaN(args[1])) {
        //discord
        url += "?DiscordID=" + message.mentions.users.first().id;
        user = message.mentions.users.first();
      } else if (args[1].length == 18) {
        url += "?DiscordID=" + args[1];
        user = client.users.find("id", args[1]).username;
      } else if (args[1].length == 17) {
        //steam
        url += "?SteamID=" + args[1];
        user = args[1];
      } else {
        message.reply("Incorrect parameter");
        return;
      }
      request(
        {
          method: "GET",
          url: url
        },
        function(err, response, body) {
          var result = "";
          if (body) {
            if (err)
              message.author
                .send("Their was an error. Send root this -> " + err)
                .catch(e =>
                  message.guild.channels
                    .get(serverInfo.BotSpam)
                    .send(
                      `${
                        message.member
                      }, your DM's are disabled and we were not able to send you information through DM.`
                    )
                );
            if (body.toLowerCase().includes("not signed up for db")) {
              result = `${
                message.mentions.users.first().username
              } was **not** found in the database.`;
              const embed = new Discord.RichEmbed()
                .setColor([255, 255, 0])
                .setAuthor("Database Check", serverInfo.logo)
                .addField("User", user)
                .addField("Error", `${result}`);
              message.channel.send(embed);
            } else if (body.toLowerCase().includes("no title set")) {
              result = `${
                message.mentions.users.first().username
              } was found in the database. But no title has been set`;
              const embed = new Discord.RichEmbed()
                .setColor([255, 255, 0])
                .setAuthor("Database Check", serverInfo.logo)
                .addField("User", user)
                .addField("Error", `${result}`);
              message.channel.send(embed);
            } else {
              var info = body.split(" ");
              var colour = info[info.length - 2];
              var steamID = info[info.length - 1];
              for (let index = 0; index < info.length - 2; index++) {
                result += info[index] + " ";
              }
              if (
                result.trim() == "X" &&
                returnColour(colour) == "Cycling Colours"
              ) {
                const embed = new Discord.RichEmbed()
                  .setColor([255, 255, 0])
                  .setAuthor("Database Check", serverInfo.logo)
                  .addField("User", user)
                  .addField(
                    "Steam Profile",
                    `https://steamcommunity.com/profiles/${steamID}`
                  )
                  .addField("Information", `User has disabled their title.`);
                message.channel.send(embed);
              } else {
                const embed = new Discord.RichEmbed()
                  .setColor([255, 255, 0])
                  .setAuthor("Database Check", serverInfo.logo)
                  .addField("User", user)
                  .addField(
                    "Steam Profile",
                    `https://steamcommunity.com/profiles/${steamID}`
                  )
                  .addField("Title", `${result}`)
                  .addField("Colour", returnColour(colour));
                message.channel.send(embed);
              }
            }
          } else {
            message.reply("There was an errror. Please try again.");
          }
        }
      );
    }
  }
};

/**
 * Returns true if user is part of staff
 * @param {user} user
 */
function isStaff(user) {
  if (
    hasRole(user, "Developer") ||
    hasRole(user, "Admin") ||
    hasRole(user, "Moderator") ||
    hasRole(user, "Support")
  ) {
    return true;
  } else {
    return false;
  }
}

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

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function WarnUser(client, serverInfo, sql, message, row, args) {
  var user = message.mentions.users.first();

  if (args.length == 2) var TheReason = "No reason provided";
  else {
    var TheReason = "";
    for (i = 2; i < args.length; i++) {
      TheReason += args[i] + " ";
    }
  }

  sql
    .run(
      `Insert Into logs(Action, Member, Moderator, Reason, Time, ChannelID) VALUES('warn', '${
        user.id
      }', '${message.author.id}', '${mysql_real_escape_string(
        TheReason
      )}', '${new Date().getTime()}', '${message.channel.id}')`
    )
    .then(() => {
      const embedChannel = new Discord.RichEmbed()
        .setColor([255, 255, 0])
        .setAuthor(`${user.tag} has been warned!`, serverInfo.logo);
      message.channel.send(embedChannel);

      var CaseID = "Error";
      sql
        .get(`select * from logs where Member = '${user.id}' order by ID desc`)
        .then(roww => {
          if (roww) CaseID = roww.ID;

          if (row.Warnings == 0) {
            const embed = new Discord.RichEmbed()
              .setColor([255, 255, 0])
              .setAuthor(
                "You have received a warning. Next warning will result in a temporary mute!",
                serverInfo.logo
              );
            user.send(embed);

            message.channel.messages.fetch({ limit: 100 }).then(messages => {
              messages.forEach(themessage => {
                if (themessage.author.id == user.id) {
                  themessage.delete();
                }
              });
            });

            const embedLog = new Discord.RichEmbed()
              .setColor([255, 255, 0])
              .setAuthor(`Case ${CaseID} | Warn`, serverInfo.logo)
              .setTitle("==> WARNING 1")
              .setDescription(
                "New warning of <@" +
                  user.id +
                  "> (" +
                  user.id +
                  ") by <@" +
                  message.author.id +
                  ">"
              )
              .addField("Reason", TheReason);
            client.guilds
              .get(serverInfo.guildId)
              .channels.get(serverInfo.modlogChannel)
              .send(embedLog)
              .then(msg => {
                sql.run(
                  `update logs set MessageID = '${
                    msg.id
                  }' where ID = '${CaseID}'`
                );
              });

            sql.run(
              `update Members set Warnings = '1' where DiscordID = '${user.id}'`
            );
          } else if (row.Warnings == 1) {
            const embed = new Discord.RichEmbed()
              .setColor([255, 255, 0])
              .setAuthor(
                "You have received a second warning! You'll now be muted for 15 minutes, you are warned!",
                serverInfo.logo
              );
            user.send(embed);

            message.channel.messages.fetch({ limit: 100 }).then(messages => {
              messages.forEach(themessage => {
                if (themessage.author.id == user.id) {
                  themessage.delete();
                }
              });
            });

            const embedLog = new Discord.RichEmbed()
              .setColor([255, 255, 0])
              .setAuthor(`Case ${CaseID} | Warn`, serverInfo.logo)
              .setTitle("==> WARNING 2")
              .setDescription(
                "New warning of <@" +
                  user.id +
                  "> (" +
                  user.id +
                  ") by <@" +
                  message.author.id +
                  ">"
              )
              .addField("Reason", TheReason);
            client.guilds
              .get(serverInfo.guildId)
              .channels.get(serverInfo.modlogChannel)
              .send(embedLog)
              .then(msg => {
                sql.run(
                  `update logs set MessageID = '${msg.id}' where ID = ${CaseID}`
                );
              });

            timeextra = new Date().getTime({ limit: 100 }) + 1000 * 60 * 15;
            sql.run(
              `update Members set Warnings = '2', MutedUntil = '${timeextra}' where DiscordID = '${
                user.id
              }'`
            );

            let TheRole = message.guild.roles.find("name", "Muted");
            let TheUser = message.guild.member(
              message.mentions.users.first().id
            );
            TheUser.addRole(TheRole);
          } else if (row.Warnings > 1) {
            const embed = new Discord.RichEmbed()
              .setColor([255, 255, 0])
              .setAuthor(
                "You have received another warning! You'll now be muted, and the staff will look into your behaviour for further actions.",
                serverInfo.logo
              );
            user.send(embed);

            message.channel.messages.fetch({ limit: 100 }).then(messages => {
              messages.forEach(themessage => {
                if (themessage.author.id == user.id) {
                  themessage.delete();
                }
              });
            });

            const embedLog = new Discord.RichEmbed()
              .setColor([255, 255, 0])
              .setAuthor(`Case ${CaseID} | Warn`, serverInfo.logo)
              .setTitle("==> WARNING 3")
              .setDescription(
                "New warning of <@" +
                  user.id +
                  "> (" +
                  user.id +
                  ") by <@" +
                  message.author.id +
                  ">"
              )
              .addField("Reason", TheReason);
            client.guilds
              .get(serverInfo.guildId)
              .channels.get(serverInfo.modlogChannel)
              .send(embedLog)
              .then(msg => {
                sql.run(
                  `update logs set MessageID = '${msg.id}' where ID = ${CaseID}`
                );
              });

            sql.run(
              `update Members set Warnings = '3' where DiscordID = '${user.id}'`
            );

            let TheRole = message.guild.roles.find("name", "Muted");
            let TheUser = message.guild.member(
              message.mentions.users.first().id
            );
            TheUser.addRole(TheRole);
          }
        });
    });
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

function returnColour(colourID) {
  switch (colourID) {
    case "0":
      return "No title";
      break;
    case "1":
      return "Gray";
      break;
    case "2":
      return "Glowing Green (Twitch Subs & Legacy)";
      break;
    case "3":
      return "Non-glowing Green";
      break;
    case "4":
      return "Non-glowing Yellow";
      break;
    case "5":
      return "Glowing Yellow";
      break;
    case "6":
      return "Purple (Twitch Subs & Legacy)";
      break;
    case "7":
      return "RLCS Blue";
      break;
    case "X":
      return "Disabled (X)";
      break;
    default:
      return "Cycling Colours";
  }
}
