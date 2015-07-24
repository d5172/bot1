'use strict';

var log4js = require('log4js');

log4js.configure({
  appenders: [{
    type: 'file',
    filename: 'logs/bot1.log'
  }, {
    type: 'console'
  }]
});

module.exports = log4js;