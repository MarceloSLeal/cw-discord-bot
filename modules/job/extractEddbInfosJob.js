const schedule = require('node-schedule');
const logger = require('heroku-logger')

const searchWingInfosFromEddb = require('../gateway/searchWingInfosFromEddb.js');
const normalizeWingInfoFromEddb = require('../service/normalizeWingInfoFromEddb.js');
const mongoConnection = require('../connection/mongoConnection.js');

const logName = '[ExtractEddbInfosJob]';

exports.execute = function() {
    //Execute every hour
    schedule.scheduleJob('0 * * * *', function(){
        logger.info(logName + ' started...');
        searchWingInfosFromEddb.get(logName, function(error, body) {
            if (!error) {
                const data = normalizeWingInfoFromEddb.getInfos(logName, body);
                mongoConnection.saveOrUpdate(logName, data, 'wingData', function(error) {
                    logger.info(logName + ' Job ended...');
                });
            }
        });
    });
};

module.exports = exports;