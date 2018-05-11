const Discord = require("discord.js");

module.exports = {
  title: "ban",
  perms: "Moderator",
  commands: ["!Ban <@tag> <?Reason>"],
  description: ["Bans the person with the given reason"],

  run: async (client, serverInfo, sql, message, args) => {
    if (
      hasRole(message.member, "Moderator") ||
      hasRole(message.member, "Admin") ||
      hasRole(message.member, "Developer")
    ) {
      //Check if someone is tagged
      if (message.mentions.users.first() == undefined) {
        const embed = new Discord.RichEmbed()
          .setColor([255, 255, 0])
          .setTitle("Please tag the user to be banned");
        return message.channel.send(embed);
      }

      if (isStaff(message.guild.member(message.mentions.users.first()))) {
        const embed = new Discord.RichEmbed()
          .setColor([255, 255, 0])
          .setTitle("You cannot ban a staff member.");
        return message.channel.send(embed);
      }

      //Check if there is a reason
      if (args.length == 2) {
        var TheReason = "No reason provided";
      } else {
        var TheReason = "";
        for (i = 2; i < args.length; i++) {
          TheReason += args[i] + " ";
        }
      }

      //Let's start banning the user
      let BannedUser = message.guild.member(message.mentions.users.first().id);
      BannedUser.ban({ reason: TheReason });

      //Insert the log into the database
      sql
        .run(
          `Insert into logs(Action, Member, Moderator, Reason, Time, ChannelID) VALUES('ban', '${
            BannedUser.id
          }', '${message.author.id}', '${mysql_real_escape_string(
            TheReason
          )}', '${new Date().getTime()}', '${message.channel.id}')`
        )
        .then(() => {
          var CaseID = "Error";
          sql
            .get(
              `select * from logs where Member = '${
                BannedUser.id
              }' order by ID desc`
            )
            .then(roww => {
              if (!roww) return message.channel.send("An error occured");

              CaseID = roww.ID;
              //Make a notice & Log it to the log-channel
              const embed = new Discord.RichEmbed()
                .setColor([255, 255, 0])
                .setAuthor(
                  `${
                    message.mentions.users.first().tag
                  } has been banned from the server. Case number: ${CaseID}`,
                  serverInfo.logo
                );
              message.channel.send(embed); //Remove this line if you don't want it to be public.

              const embedlog = new Discord.RichEmbed()
                .setColor([255, 255, 0])
                .setAuthor(`Case ${CaseID} | User Ban`, serverInfo.logo)
                .setDescription(
                  `${message.guild.members.get(
                    message.mentions.users.first().id
                  )} (${
                    message.mentions.users.first().id
                  }) has been banned by ${message.member}`
                )
                .setTimestamp()
                .addField("Reason", TheReason);
              message.guild.channels
                .get(serverInfo.modlogChannel)
                .send(embedlog)
                .then(msg => {
                  sql.run(
                    `update logs set MessageID = '${
                      msg.id
                    }' where ID = '${CaseID}'`
                  );
                });
            });
        })
        .catch(err => console.log(err));
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

/**
 * Returns true if user is part of staff
 * @param {user} user
 */
function isStaff(user) {
  if (
    hasRole(user, "Staff") ||
    hasRole(user, "Developer") ||
    hasRole(user, "Admin")
  ) {
    return true;
  } else {
    return false;
  }
}
