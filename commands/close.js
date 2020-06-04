module.exports = {
    name: 'close',
    description: 'Closes the stock market manually.',
    execute(msg) {
        msg.channel.send("<@&709405462831038514> The stock market has been closed.");
    }
}