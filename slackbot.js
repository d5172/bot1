'use strict';

var bot = require('./bot');
var Slack = require('slack-client');
var log = require('./log').getLogger('slackbot');

var TOKEN = 'xoxb-8162043616-d410aGNIbkrt2iDYPUotOXxu';
var autoReconnect = true;
var autoMark = true;

var slack = new Slack(TOKEN, autoReconnect, autoMark);

function isDirectMessageChannel(channelName) {
  return channelName.indexOf('#') === -1;
}

function isAtMe(text) {
  return text.indexOf(atMeString()) !== -1;
}

function atMeString() {
  return '<@' + slack.self.id + '>:';
}

slack.on('open', function() {
  var channel, channels, group, groups, id, messages, unreads;
  channels = [];
  groups = [];
  unreads = slack.getUnreadCount();
  channels = (function() {
    var _ref, _results;
    _ref = slack.channels;
    _results = [];
    for (id in _ref) {
      channel = _ref[id];
      if (channel.is_member) {
        _results.push('#' + channel.name);
      }
    }
    return _results;
  })();
  groups = (function() {
    var _ref, _results;
    _ref = slack.groups;
    _results = [];
    for (id in _ref) {
      group = _ref[id];
      if (group.is_open && !group.is_archived) {
        _results.push(group.name);
      }
    }
    return _results;
  })();
  log.info('connected to slack as ' + slack.self.name);
  console.log('Welcome to Slack. You are @' + slack.self.name + ' of ' + slack.team.name);
  console.log('You are in: ' + channels.join(', '));
  console.log('As well as: ' + groups.join(', '));
  messages = unreads === 1 ? 'message' : 'messages';
  return console.log('You have ' + unreads + ' unread ' + messages);

});

slack.on('message', function(message) {

  //console.log(message);

  var channel, channelError, channelName, errors, text, textError, ts, type, typeError, user, userName;
  channel = slack.getChannelGroupOrDMByID(message.channel);
  user = slack.getUserByID(message.user);

  type = message.type, ts = message.ts, text = message.text;
  channelName = (channel != null ? channel.is_channel : void 0) ? '#' : '';
  channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');
  userName = (user != null ? user.name : void 0) != null ? '@' + user.name : 'UNKNOWN_USER';

  console.log('Received: ' + type + ' ' + channelName + ' ' + userName + ' ' + ts + ' \'' + text + '\'');

  if (type === 'message' && (text != null) && (channel != null)) {

    if (isDirectMessageChannel(channelName) || isAtMe(text)) {

      var input = text.replace(atMeString(), '').trim();
      log.debug('input', input);
      var person = userName.replace('@', '');
      return bot.process(input, person).then(function(response) {
        log.debug('output', response);
        if (response) {
          channel.send(response);

          console.log('@' + slack.self.name + ' responded with \'' + response + '\'');
        }

      });
    }

  } else {
    typeError = type !== 'message' ? 'unexpected type ' + type + '.' : null;
    textError = text == null ? 'text was undefined.' : null;
    channelError = channel == null ? 'channel was undefined.' : null;
    errors = [typeError, textError, channelError].filter(function(element) {
      return element !== null;
    }).join(' ');
    return console.log('@' + slack.self.name + ' could not respond. ' + errors);
  }
});

slack.on('error', function(error) {
  log.error(error);
  return console.error('Error: ' + error);
});

slack.login();