'use strict';

var log4js = require('log4js');
var minimist = require('minimist');

var args = minimist(process.argv);

if (args.nolog) {
  log4js.clearAppenders();
} else {
  log4js.configure({
    appenders: [{
      type: 'file',
      filename: 'logs/bot1.log'
    }, {
      type: 'console'
    }]
  });
}

module.exports = log4js;