module.exports = {
    name: 'help',
    description: 'Displays all commands.',
    execute(msg, embed) {
        msg.channel.send(embed);
    }
}