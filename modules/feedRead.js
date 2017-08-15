const FeedParser = require('feedparser');
const request = require('request');
const logger = require('heroku-logger');
const cheerio = require('cheerio');
var exports = {};

exports.readFeed = function() {
    
    var req = request('https://forums.frontier.co.uk/external.php?type=RSS2&forumids=73')
    var feedparser = new FeedParser();
    
    req.on('error', function (error) {
        logger.error('[feedRead] Error on request');
    });
    
    req.on('response', function (res) {
        var stream = this; // `this` is `req`, which is a stream 
        
        if (res.statusCode !== 200) {
            this.emit('error', new Error('Bad status code'));
        }
        else {
            stream.pipe(feedparser);
        }
    });
    
    feedparser.on('error', function (error) {
        logger.error('[feedRead] Error on feedparser');
    });
    
    feedparser.on('readable', function () {
        // This is where the action is! 
        var stream = this; // `this` is `feedparser`, which is a stream 
        var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance 
        var item;
        
        while (item = stream.read()) {
            
            const $ = cheerio.load(item.description);

            let desc = $('blockquote > table > tbody > tr > td > table:nth-child(3) > tbody > tr > td > table > tbody > tr > td > div > p:nth-child(4) > span');

            if (!desc) {
                desc = $('blockquote > table > tbody > tr > td > table:nth-child(3) > tbody > tr > td > table > tbody > tr > td > div > p:nth-child(4) > font');
            }

            console.log(desc);
        }
    });
    
    //msg.channel.send('O bot tomou interdiction, aguarde um instante e tente ' +
    //    'novamente, fly safe CMDR!');
};


module.exports = exports;