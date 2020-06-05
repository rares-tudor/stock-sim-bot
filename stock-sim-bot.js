const fs = require('fs'); // File System module, used on line 15.
const Discord = require('discord.js'); // loading the discord.js API
const {Client} = require('unb-api'); // loading the UnbelieveaBot API, if another economics bot is used, adaptation is needed!
const {Sequelize, Model} = require('sequelize'); // Sequelize is what we use here for DB management, with the SQLite dialect
const {prefix, token, bot_name, bot_avi_url, bot_name_footer, guildID, unb_token, main_channel_id, admin_id} = require('./config.json'); // Taking all the variables from the config file

const client = new Discord.Client({ // necessary stuff for the discord client connection
    partials: ["REACTION", "MESSAGE"],
    ws: { intents: ["GUILD_MESSAGES"] }
});
client.commands = new Discord.Collection(); // extension of Map class
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); // loading all the commands from the directory
const unboatClient = new Client(unb_token);  // loading the UnbelieveaBoat API Client for direct connection

for(const file of commandFiles) { // Fetching commands
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const sequelize = new Sequelize('database', 'user', 'password', { // DB declaration
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite',
});

class Companies extends Model {}
Companies.init({ // Company Model
    name: {
        type: Sequelize.STRING,
        unique: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    short: {
        type: Sequelize.STRING,
        unique: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    value: {
        type: Sequelize.FLOAT,
        defaultValue: 1000.0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    abs_gr: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    rel_gr: {
        type: Sequelize.FLOAT,
        defaultValue: 0.0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    logo_url: {
        type: Sequelize.STRING,
        unique: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}, {sequelize: sequelize, modelName: 'Companies'});

class Investments extends Model {}
Investments.init({ // Investment model
    co_name: {
        type: Sequelize.STRING,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    user_no: {
        type: Sequelize.INTEGER,
        unique: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    amount: {
        type: Sequelize.FLOAT,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}
    ,{
    setterMethods: {
        setValue(value) {
            this.setDataValue('amount', value);
        }
    },
    sequelize: sequelize, modelName: 'Investments'});

class Company_Investments extends Model {}
Company_Investments.init({ // M:N Model between Company and Investment Models
    co_inv_id: {
        type: Sequelize.INTEGER,
        unique: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
}, {sequelize: sequelize, modelName: 'Company_Investments'});

// Establishing M:N connections
Investments.belongsToMany(Companies, { through: 'Company_Investments' });
Companies.belongsToMany(Investments, { through: 'Company_Investments' });

var sample = ""; // Sample string for concatenating
var open = false; // Market starts off closed
var bot_bool = false; // Decides whether the bot executes the random events or not (DEFAULT: FALSE)
        
const helpEmbed = new Discord.MessageEmbed() // Creating the info embed
    .setColor('#0099ff')
    .setTitle('All Commands')
    .setAuthor(bot_name, bot_avi_url)
    .setDescription('All commands with an explanation and permissions.')
    .setThumbnail(bot_avi_url)
    .addFields(
        {name: '.open', value: 'Opens the stock market. \nPerm: ADMIN', inline: true},
        {name: '.close', value: 'Closes the stock market. \nPerm: ADMIN', inline: true},
        {name: '.showcompanies', value: 'Shows all registered companies. \nPerm: Everybody'},
        {name: '.showcompany', value: '```Example: \n.showcompany short COM``` \nShows the info of a company. \nPerm: Everybody'},
        {name: '.addcompany', value: '```Example: \n.addcompany CompanyName COM https://example.com``` \nAdds a company. \nPerm: ADMIN'},
        {name: '.editcompany', value: '```Example: \n.editcompany short CompanyName COMNEW``` \nEdits the name of a company. \nPerm: ADMIN'},
        {name: '.deletecompany', value: '```Example: \n.deletecompany CompanyName``` \nDeletes a company. \nPerm: ADMIN'},
        {name: '.invest', value: '```Example: \n.invest CompanyName 500``` \nLets you invest in a company. \nPerm: Everybody'},
        {name: '.showinvestments', value: 'Shows all your investments. \nPerm: Everybody'},
        {name: '.withdrawinvestment', value: '```Example: \n.withdrawinvestment CompanyName``` \nLets you withdraw an investment. \nPerm: Everybody'},
        {name: '.help', value: 'Shows this embed. \nPerm: ADMIN', inline: true}
        )
        .setTimestamp()
        .setFooter(bot_name_footer, bot_avi_url);

// Calculating the time required to wait before next random events (continued in the messageDelete event, line 424)
function calcDelay() {
    let d = new Date();
    if(d.getMinutes() < 30) {
        return ((30 - d.getMinutes()) * 60000);
    } else if(d.getMinutes() > 30) {
        return ((d.getMinutes() - 30) * 60000);
    }
}

client.once('ready', () => { // Bot ready, at startup
    let date = new Date(); 
    console.log(`Logged in as ${client.user.tag}!`);
    Companies.sync(); Investments.sync(); Company_Investments.sync(); // Synchronizing the DB, add {force: true} as an argument for each one if you want to reset them at each use.
    client.channels.fetch(main_channel_id) 
    .then(channel => channel.send(('Bot initialized. Time: ').concat(date.toString()))); // Sending confirmation to main channel
});


// Bot awaits message (command) and executes it
client.on('message', async msg => {
    // Fetching arguments
    const args = msg.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    
    if ((command === 'open') && (msg.author.id == admin_id)) { // Opens the market, activates events
        if(open) {
            return msg.channel.send("Error - The stock market is already open.");
        }
        if(msg.author.id != admin_id) {
            return msg.channel.reply("you dont have the permission to do this.");
        }
        client.commands.get('open').execute(msg);
        open = true;
        let delay_ms = calcDelay(); // Starting to execute the random fluctuations
        msg.channel.send("Initializing event procedures. (Ignore this message)")
        .then(message => {
            message.delete({timeout: delay_ms});
        });
        bot_bool = true; // Required
    }
    else if(command === 'close') { // Closes the market, deactivates some functions and all events
        if(!open) {
            return msg.channel.send("Error - The stock market is already closed.");
        }
        if(msg.author.id != admin_id) {
            return msg.channel.reply("you dont have the permission to do this.");
        }

        client.commands.get('close').execute(msg);
        open = false;
    }
    else if(command === 'showcompanies') { // Shows all registered companies
        const coList = await Companies.findAll({attributes: ['name']});
        const coString = coList.map(c => c.name).join(', ') || 'Error - No companies registered'; // Searching for every single company
        return msg.channel.send(`List of companies registered: ${coString}`); // Showing all companies by their names
    } 
    else if(command === 'showcompany') { // Shows the info of a company using embeds
        // Checking for NULL arguments
        if(args[0].length == 0) {
            return msg.channel.send("Error - You haven't inserted any type argument. Correct Syntax: \n```.showcompany type name/short```");
        } else if(args[1].length == 0) {
            return msg.channel.send("Error - You haven't inserted any name. Correct Syntax: \n```.editcompany type name/short```");
        }

        // Initializing arguments
        var type = args[0];
        var arg = args[1];

        if(type === 'name') { // Checking for type
            // Creating the embed
            const co = await Companies.findOne({where: { name: arg }});
            if(co) {
                try {
                    const coEmbed = new Discord.MessageEmbed() // Creating the embed..
                    .setColor('#0099ff')
                    .setTitle(co.get('name'))
                    .setAuthor(bot_name, bot_avi_url)
                    .setDescription('Updates for the '.concat(co.get('name'), ' Company'))
                    .setThumbnail(co.get('logo_url'))
                    .addFields(
                        {name: 'Short Name', value: co.get('short')},
                        {name: 'Value', value: Number(co.get('value')).toFixed(2)},
                        {name: 'Absolute Growth', value: Number(co.get('abs_gr')).toFixed(2), inline: true},
                        {name: 'Relative Growth', value: sample.concat(Number(co.get('rel_gr')).toFixed(2), '%'), inline :true}
                        )
                        .setTimestamp()
                        .setFooter(bot_name_footer, bot_avi_url);
                    return msg.reply(coEmbed); // ..and printing it
                    }
                    catch(e) {
                        console.log(e);
                        return msg.reply(" there has been an error, check the console log.");
                    }
                }
        } else if(type === 'short') { // Doing the same thing for the short type
            const co = await Companies.findOne({where: { short: arg }});
            if(co) {
                try {
                    const coEmbed = new Discord.MessageEmbed() // Creating the embed..
                    .setColor('#0099ff')
                    .setTitle(co.get('name'))
                    .setAuthor(bot_name, bot_avi_url)
                    .setDescription('Updates for the '.concat(co.get('name'), ' Company'))
                    .setThumbnail(co.get('logo_url'))
                    .addFields(
                        {name: 'Short Name', value: co.get('short')},
                        {name: 'Value', value: co.get('value')},
                        {name: 'Absolute Growth', value: co.get('abs_gr'), inline: true},
                        {name: 'Relative Growth', value: sample.concat(co.get('rel_gr'), '%'), inline :true}
                        )
                        .setTimestamp()
                        .setFooter(bot_name_footer, bot_avi_url);
                    return msg.reply(coEmbed); //.. and printing it
                }
                catch(e) {
                    console.log(e);
                    return msg.reply(" there has been an error, check the console log.");
                }
            }
        }  
    }
    else if(command === 'addcompany') { // Adds a company
        if(open) { // Command only works while the market is opened
            return msg.channel.send("Error - You can't add new companies while the market is open.");
        }
        if(msg.author.id != admin_id) {
            return msg.channel.reply("you dont have the permission to do this.");
        }

        // Checking for NULL arguments
        if(args[0].length == 0) {
            return msg.channel.send('Error - You haven\'t inserted any name. Correct Syntax: \n```.addcompany name short logo_url```');
        } else if(args[1].length == 0) {
            return msg.channel.send("Error - You haven't inserted any short. Correct Syntax: \n```.addcompany name short logo_url```");
        }

        // Initializing the arguments
        var _name = args[0];
        var _short = args[1];
        var _logo_url = args[2];
        

        // Checking for wrong URL structure
        if(!(_logo_url.startsWith('https://') && _logo_url.length != 0)) { return msg.channel.send("Error - The logo URL has to start with https. If you don't want a logo, keep it empty. "); }

        try { // Creating the DB entry
            const co = await Companies.create({
                name: _name,
                short: _short,
                value: 100.0,
                abs_gr: 0.0,
                rel_gr: 0.0,
                logo_url: _logo_url,
            });
            return msg.reply(`company ${_name} registered.`);
        } 
        catch(e) {
            if (e.name === 'SequelizeUniqueConstraintError') { // Not allowing duplicates, check the declaration for more info (lines 27 and following)
                return msg.reply('that company already exists.');
            }
            return msg.reply('something went wrong with adding a company.');
        }
    }
    else if(command === 'editcompany') { // Edits a company
        if(open) { // Command only works while the market is opened
            return msg.channel.send("Error - You can't edit companies while the market is open.");
        }

        if(msg.author.id != admin_id) {
            return msg.channel.reply("you dont have the permission to do this.");
        }

        // Checking for null arguments
        if(args[0].length == 0) {
            return msg.channel.send('Error - You haven\'t inserted any type argument. Correct Syntax: \n```.editcompany type name new_value```');
        } else if(args[1].length == 0) {
            return msg.channel.send("Error - You haven't inserted any name. Correct Syntax: \n```.editcompany type name new_value```");
        } else if(args[2].length == 0) {
            return msg.channel.send("Error - You haven't inserted any new value. Correct Syntax: \n```.editcompany type name new_value```");
        }

        // Initializing arguments
        var type = args[0];
        var _name = args[1];
        var arg2 = args[2];


        // Updating the company based on the type argument
        if(type === 'name') {
            const affectedRows = await Companies.update({ name: arg2 }, { where: { name: _name }});
            if(affectedRows > 0) {
                return msg.reply('The company was updated.');
            }
            return msg.channel.send(`Error - Couldn't find the appropiate company.`);
        } else if(type === 'short') {
            const affectedRows = await Companies.update({ short: arg2 }, { where: { name: _name }});
            if(affectedRows > 0) {
                return msg.reply('The company was updated.');
            }
            return msg.channel.send(`Error - Couldn't find the appropiate company.`);
        }
        else if(type === 'logo_url') {
            const affectedRows = await Companies.update({ logo_url: arg2 }, { where: { name: _name }});
            if(affectedRows > 0) {
                return msg.reply('The company was updated.');
            }
            return msg.channel.send(`Error - Couldn't find the appropiate company.`);
        }
    }  
    else if(command === 'deletecompany') { // Deletes a company
        if(open) { // Command only works while the market is opened
            return msg.channel.send("Error - You can't delete a company while the market is open.");
        }
        // Checking for null arguments
        if(args[0].length == 0) {
            return msg.channel.send('Error - You haven\'t inserted any arguments. Correct Syntax: .deletecompany company_name');
        }
        if(msg.author.id != admin_id) {
            return msg.channel.reply("you dont have the permission to do this.");
        }

        const coName = args[0]; // Initializing arguments

        // Running delete command
        const rowCount = await Companies.destroy({ where: {name: coName}});
        if(!rowCount) return msg.reply('You tried deleting a company which does not exist.');

        return msg.reply('Company deleted');
    }
    else if(command === 'help') { // Displays all commands using the embed
        client.commands.get('help').execute(msg, helpEmbed);
    }
    else if(command === 'invest') { // Lets you invest in a company
        // Checking for NULL arguments
        if(args[0].length == 0) {
            return msg.reply('you must specify a name.');
        } else if (args[1].length == 0) {
            return msg.reply('you must invest a value bigger than 0.');
        }

        // Initializing arguments
        let co_name = args[0];
        let inv_amount = args[1];
        var cash_amount;

        // Checking if the user has enough balance
        // unboatClient.getUserBalance(guildID, msg.author.id).then(user => function () {
        //     cash_amount = Number(user[0]);
        //     console.log("User Cash:", user.cash);
        // });
        // console.log(cash_amount);

        // Editing the user balance according to the investment
        unboatClient.editUserBalance(guildID, msg.author.id, {cash: -inv_amount}, "Reduction of balance");
        const co = await Companies.findOne({where: { name: co_name }});
        if(co) {
            try {
                const new_inv = await Investments.create({ // Adding it to the table if the according company is found
                    co_name: co.get('name'),
                    user_no: msg.author.id,
                    amount: inv_amount,
                });
                return msg.reply(`your investment has been registered.`);
            }
            catch(e) {
                console.log(e);
            }
        } else {
            return msg.reply('the company could not be found.'); // Error checking
        }
    }
    else if(command === 'showinvestments') { // Lets you show your own investments
        const invList = await Investments.findAll({attributes: ['co_name', 'amount'], 
                                                    where: { user_no: msg.author.id }}); // Finds all investments of the usera
        // Same procedure as for the showcompanies command
        const nameString = invList.map(i => i.co_name) || 'Error - No investments found';
        const amountString = invList.map(i => i.amount) || 'Error - No investments found';

        invString = ""; let i = 0;

        for(let j = 0; j < nameString.length; ++j) { // Iterating through the string and consequently forming the string
            ++i;
            invString = invString.concat("\nInvestment nr.", i,"\nName: ", nameString[j], "\nAmount: ", amountString[j], "\n");
        }
        return msg.reply(`here are all your investments: \n${invString}`); // Replying
    }
    else if(command === 'withdrawinvestment') { // Lets you withdraw an investment
        if(open) { // Checking if the stock market is open
            return msg.channel.send("Error - You can't withdraw your investment while the market is open.");
        }
        // Checking for NULL arguments
        if(args[0].length === 0) {
            return msg.reply(' error - you must specify the name of a company');
        }

        var _name = args[0]; // Initializing argument

        // Finding the specified investment
        const inv = await Investments.findOne({attributes: ['amount'], where: {co_name: _name}});
        if(inv) {
            try {
                // Returning the investment to the user by adding the amount to his balance
                let amount = Number(inv.get('amount'));
                unboatClient.editUserBalance(guildID, msg.author.id, {cash: amount}, "Return of investment");

                // Deleting the investment, as it has now been fully refunded
                const rowCount = await Investments.destroy({where: {co_name: _name}});
                if(!rowCount) return msg.reply('The investment does not exist.');
                
                return msg.reply('Your investment has been successfully withdrawn.');
            } catch(e) {
                return msg.reply(' something went wrong: '.concat(e));
            }

        }
    }
});

// Bot awaits deletion of message (used for timing random events, recursive)
client.on('messageDelete', async msg => {
    // Events changing the value of random companies, at a random rate.
    if(msg.author.bot && bot_bool) {
        bot_bool = false;
        // Determining company and rate of growth
        var coRand = Math.floor(Math.random() * 3) + 1; // Replace the 3 with your amount of companies
        var new_rel_gr = (Math.random() * 2) + 0.5; // The formula for relative growth
        const co = await Companies.findOne({where: {id: coRand}});
        var co_name = co.get('name'); // For easier reading purposes

        // Formulas for the new value and the absolute growth
        let new_val = co.get('value') + (co.get('value') * new_rel_gr);
        let new_abs_gr = new_val - new_rel_gr;

        // Updating the values
        const affectedRows_val = await Companies.update( { value: new_val }, { where: { name: co.get('name') } } );
        const affectedRows_abs_gr = await Companies.update( { abs_gr: new_abs_gr }, { where: { name: co.get('name') } } );
        const affectedRows_rel_gr = await Companies.update( { rel_gr: new_rel_gr }, { where: { name: co.get('name') } } );

        // Letting the users know
        if((affectedRows_abs_gr > 0) && (affectedRows_rel_gr > 0) && (affectedRows_val > 0)) {
            msg.channel.send(`The value of the ${co_name} company has been updated.`);
        }

        // Updating all the investments
        const userList = await Company_Investments.findAll({
            where: { companiesId: co.get('id') }, 
            include: [{ model: Companies, as: Companies.id },
                      { model: Investments, as: Investments.user_no }]})
        .then(async function distribute() {
            for(id in Investments.user_no)
            {
                const user = await Investments.findOne({ where: { user_no: id}});
                if(user) {
                    try {
                        user.setValue(user.get('amount') * new_rel_gr);
                    }
                    catch(e) {
                        return msg.reply(', something went wrong: '.concat(e));
                    }
                }
            }
            // Letting the users know
            msg.channel.send('The value of the investments has been updated.');
        });

        // Repeating the procedure
        msg.channel.send("Initializing event procedures. (Ignore this message)")
        .then(message => {
            message.delete({timeout: 1800000});
        });
        bot_bool = true;
    }
});
            
client.login(token); // Logging in with the token