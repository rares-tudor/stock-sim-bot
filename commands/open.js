const {role_id} = require ('./config.json');

module.exports = {
    name: 'open',
    description: 'Opens the stock market manually.',
    execute(msg) {
        var response = "<@&";
        response.concat(role_id, "> The stock market has been opened.");
    }
}