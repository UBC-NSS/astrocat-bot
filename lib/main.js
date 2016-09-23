var Botkit = require('botkit');
var http = require('http');
var weather_endpoint = "http://api.openweathermap.org/data/2.5/weather?q=<your_city>&appid=<your_api_key>";

function Bot(config) {
    var controller = Botkit.slackbot();
    setup_hooks(controller, config);

    var bot = controller.spawn({
	token: config.slack.api_token
    });
    this.bot = bot;
}

Bot.prototype.start = function () {
    this.bot.startRTM(function(err,bot,payload) {
	if (err) {
	    throw new Error('Could not connect to Slack');
	}
    });
};

function setup_hooks(controller, config) {
    controller.hears(["meow", "Meow"], ["direct_mention", "direct_message", "ambient"], function (bot, message) {
	bot.reply(message,'Meoow.');
    });

    // direct message and @bot mentions
    controller.hears(["([^ ]+ )?weather", "weather in (.*)"], ["direct_message", "direct_mention"] ,function(bot, message) {
	var city = message.match[1];
	if (city === undefined) {
	    city = 'vancouver';
	}

	city = city.toLowerCase().trim();

	console.log("msg", message);
    
	// { type: 'message',
	//   channel: 'D2DC6BQFM',
	//   user: 'U2',
	//   text: 'vancouver weather',
	//   ts: '1474334093.000021',
	//   team: 'T07A7RJFN',
	//   event: 'direct_message',
	//   match: 
	//    [ 'vancouver weather',
	//      'vancouver ',
	//      index: 0,
	//      input: 'vancouver weather' ] }
    
	var options = {
            protocol : 'http:',
            host : 'api.openweathermap.org',
            path : '/data/2.5/weather?q='+encodeURIComponent(city)+'&appid='+encodeURIComponent(config.weather.api_key),
            port : 80,
            method : 'GET'
	};

	var request = http.request(options, function(response){
            var body = "";
            response.on('data', function(data) {
		body += data;
	    });

	    response.on('end', function () {
		weather = JSON.parse(body);
		console.log("weather:", weather);

		var summary = (weather.weather[0].main).toLowerCase();

		bot.reply(message, "me seez " + summary + " above " + city);
		var reaction = "";
		switch(summary)
		{
                    case "clear":
                    reaction = "mostly_sunny";
                    bot.reply(message,":"+reaction+":");
                    bot.reply(message,"but I haz shades for purrtection");
                    break;
                    case "clouds":
                    case "cloud":
                    reaction = "cloud";
                    bot.reply(message,":"+reaction+":");
                    break;
                    case "smoke":
                    reaction = "smoking";
                    bot.reply(message,":"+reaction+":");
                    break;
                    case "rain":
                    reaction = "rain_cloud";
                    bot.reply(message,":"+reaction+":");
                    bot.reply(message,"aarrghz rainz!! " + city);
                    break;
                    case "thunderstorm":
                    reaction = "thunder_cloud_and_rain";
                    bot.reply(message,":"+reaction+":");
                    bot.reply(message,"eww. best stayz indoorz in " + city);
                    break;
		}
		bot.api.reactions.add({
                    timestamp: message.ts,
                    channel: message.channel,
                    name: reaction,
		}, function(err, res) {
                    if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
                    }
		});
            });
	});
	request.on('error', function(e) {
            console.log('Problem with request: ' + e.message);
            bot.reply(message, "apolzogies, i haz no clue" + city);
	});
	request.end();
    });
}

module.exports = Bot;
