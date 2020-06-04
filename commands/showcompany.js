module.exports = {
    name: 'showcompany',
    description: 'Lets the user display a company.',
    async execute(type, arg) {
        if(type === 'name') {
            const co = await Companies.findOne({where: { name: arg }});
            if(co) {
                try {
                    const coEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(co.get('name'))
                    .setAuthor(bot_name, bot_avi_url)
                    .setDescription('Updates for the '.concat(co.get('name'), 'Company'))
                    .setThumbnail(co.get('logo_url'))
                    .addFields(
                        {name: 'Short Name', value: co.get('short')},
                        {name: 'Value', value: co.get('value')},
                        {name: 'Absolute Growth', value: co.get('abs_gr'), inline: true},
                        {name: 'Relative Growth', value: sample.concat(co.get('rel_gr'), '%'), inline :true}
                    )
                    .setTimestamp()
                    .setFooter(bot_name_footer, bot_avi_url);
                    return msg.channel.reply({embed: coEmbed});
                }
                catch(e) {
                    return console.log(e);
                }
            }
        } else if(type === 'short') {
            const co = await Companies.findOne({where: { short: arg }});
            if(co) {
                const coEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(co.get('name'))
                .setAuthor(bot_name, bot_avi_url)
                .setDescription('Updates for the '.concat(co.get('name'), 'Company'))
                .setThumbnail(co.get('logo_url'))
                .addFields(
                    {name: 'Short Name', value: co.get('short')},
                    {name: 'Value', value: co.get('value')},
                    {name: 'Absolute Growth', value: co.get('abs_gr'), inline: true},
                    {name: 'Relative Growth', value: sample.concat(co.get('rel_gr'), '%'), inline :true}
                )
                .setTimestamp()
                .setFooter(bot_name_footer, bot_avi_url);
                return msg.channel.reply({embed: coEmbed});
            }
        }  
    }
}