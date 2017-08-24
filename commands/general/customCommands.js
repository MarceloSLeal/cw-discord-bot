const { Command } = require('discord.js-commando');
const logger = require('heroku-logger');
const { RichEmbed } = require('discord.js');
const mongoConnection = require('../../modules/mongoConnection.js');
const errorMessage = require('../../modules/errorMessage.js');

const logName = '[customCommand]';
const doubleWrapLine = '\n\n';
const wingColor = '#f00000';

module.exports = class CustomCommand extends Command {
    constructor(client) {
        super(client, {
            name: '@general',
            group: 'general',
            memberName: 'customcommands',
            description: 'Command to execute custom commands'
        });
    }

    async run(msg, args) {
        const commandName = String(msg.message.content).replace(args, '').replace('!', '');
        logger.info(logName + ' Execute help command = ' + commandName + ' by user = ' + msg.message.author.username);
        
        const query = {_id: commandName};
        mongoConnection.find(logName, query, 'customCommands', function(error, data) {
            
            if (error) {
                logger.error(logName + ' Error on plotly graph', {'error': error});
                return errorMessage.sendClientErrorMessage(msg);
            }
            if (!data || data.length == 0) {
                logger.info(logName + ' Error on plotly graph', {'error': error});
                return errorMessage.sendSpecificClientErrorMessage(msg, 'Comando não encontrado... :thinking:');
            }
            const item = data[0];
            let embed = new RichEmbed()
                .setColor(wingColor)
                .setTimestamp()
                .setFooter('Fly safe cmdr!')
                .setTitle(getValue(item.title))
                .setImage(getValue(item.image))
                .setDescription(getValue(item.content));

            return msg.embed(embed);
        });

        function getValue(param) {
            return param ? param : '';
        }
        
    }
}    