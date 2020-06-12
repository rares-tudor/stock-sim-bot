const Discord = require('discord.js');
const {bot_avi_url, bot_name_footer} = require('../config.json');

module.exports = {
    name: 'open',
    description: 'Opens the stock market manually.',
    execute(msg, authorN, authorU) {
        const opEmbed = new Discord.MessageEmbed()
        .setColor('#2fff00')
        .setTitle('Opening the stock market')
        .setAuthor(authorN, authorU)
        .setThumbnail(bot_avi_url)
        .addField('Success', ':white_check_mark: The stock market has been succesfully opened.')
        .setTimestamp()
        .setFooter(bot_name_footer, bot_avi_url);
        msg.channel.send(opEmbed);
    }
}