'use strict';
var repl = require('repl');
var bot = require('./bot');

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