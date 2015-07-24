'use strict';
var repl = require('repl');
var Bot = require('./bot');
var bot = new Bot();

var botProcess = function(cmd, context, filename, callback) {
  var input = cmd.replace('\n', '').replace('(', '').replace(')', '');
  bot.process(input).then(function(output) {
    console.log(output);
  });
};

var server = repl.start({
  ignoreUndefined: true,
  eval: botProcess
});

bot.on('message', function(message){
  console.log(message.text);
});