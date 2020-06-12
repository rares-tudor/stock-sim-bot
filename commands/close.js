const Discord = require('discord.js');
const {bot_avi_url, bot_name_footer} = require('../config.json');

module.exports = {
    name: 'close',
    description: 'Closes the stock market manually.',
    execute(msg, authorN, authorU) {
        const clsEmbed = new Discord.MessageEmbed()
        .setColor('#2fff00')
        .setTitle('Closing the stock market')
        .setAuthor(authorN, authorU)
        .setThumbnail(bot_avi_url)
        .addField('Success', ':white_check_mark: The stock market has been succesfully closed.')
        .setTimestamp()
        .setFooter(bot_name_footer, bot_avi_url);
        msg.channel.send(clsEmbed);
    }
}