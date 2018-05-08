const Discord = require("discord.js");

module.exports = {
    title: "ping",
    perms: "everyone",
    commands: ["!ping"],
    description: ["Check latency of the bot"],

    run: async (client, serverInfo, message) => {
        if (!message.editable) {
            const pingMsg = await message.reply('Pinging...');
            return pingMsg.edit(`${message.channel.type !== 'dm' ? `${message.author},` : ''} 🏓 Pong! The message round-trip took ${pingMsg.createdTimestamp - message.createdTimestamp}ms.`);
        } else {
            await message.edit('Pinging...');
            return message.edit(`🏓 Pong! The message round-trip took ${message.editedTimestamp - message.createdTimestamp}ms.`);
        }
    }
};
