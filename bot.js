'use strict';

var Promise = require('bluebird');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var log = require('./log').getLogger('bot');
var parseInput = require('./parse-input');
var _ = require('lodash');
var wikidata = require('./wikidata');
var conversations = require('./conversations');

var greetings = ['hi', 'hello', 'hey'];

var RESUME_MS = 60000;

module.exports = Bot;

function Bot() {
  conversations.init();
  this.timers = [];
}

util.inherits(Bot, EventEmitter);

Bot.prototype.process = function(input, context) {
  var self = this;
  return Promise.try(function() {
    return conversations.establish(context).then(function(conversation) {
      stopThinking(conversation);
      return parseInput(input).then(function(parsedInput) {
        var handler = parsedInput.isQuestion ? handleQuestion : handleStatement;
        return handler(parsedInput, conversation).then(function(reply) {
          trackConversation(conversation, parsedInput, reply);
          startThinking(conversation);
          return reply;
        });
      });
    });
  }).catch(function(err) {
    log.error('processing "' + input + '"', err);
    return 'That does not compute.';
  });

  function startThinking(conversation) {
    if (_.find(self.timers, {
        context: conversation.context
      })) {
      return;
    }
    log.debug('start thinking in %s', conversation.context);
    var t = setTimeout(function(conversation) {
      log.debug('continuing conversation in %s', conversation.context);
      getContinueConversationText(conversation).then(function(text) {
        self.emit('message', {
          context: conversation.context,
          text: text
        });
        stopThinking(conversation);
        trackConversation(conversation, null, text);
      });
    }, RESUME_MS, conversation);

    self.timers.push({
      context: conversation.context,
      id: t
    });

  }

  function stopThinking(conversation) {
    log.debug('stop thinking in %s', conversation.context);
    _.filter(self.timers, {
      context: conversation.context,
    }).forEach(function(timer) {
      clearTimeout(timer.id);
      _.remove(self.timers, function(t) {
        return t.context === conversation.context;
      });
    });
  }
};

function getContinueConversationText(conversation) {
  return Promise.resolve('yo');
}

function trackConversation(conversation, parsedInput, reply) {
  var inputToTrack = null;
  if (parsedInput) {
    inputToTrack = parsedInput.originalInput;
  }
  conversations.track(conversation, inputToTrack, reply);
}

var handleQuestion = function(parsedInput, conversation) {
  if (_.startsWith(parsedInput.cleanedInput, 'what')) {
    return whatIs(parsedInput);
  } else if (_.startsWith(parsedInput, 'who')) {
    return whatIs(parsedInput);
  } else if (_.startsWith(parsedInput, 'why')) {
    return whatIs(parsedInput);
  } else if (_.startsWith(parsedInput, 'when')) {
    return whatIs(parsedInput);
  } else if (_.startsWith(parsedInput, 'where')) {
    return whatIs(parsedInput);
  } else if (_.startsWith(parsedInput, 'how')) {
    return whatIs(parsedInput);
  } else if (_.startsWith(parsedInput, 'do you')) {
    return doYou(parsedInput);
  } else {
    return whatIs(parsedInput);
  }
};

var handleStatement = function(parsedInput, conversation) {
  return new Promise(function(resolve, reject) {

    if (parsedInput.tokens.length > 0 && _.contains(greetings, parsedInput.tokens[0].toLowerCase())) {
      return resolve(parsedInput.tokens[0] + '!');
    }

    if (parsedInput.tags.length > 0 && parsedInput.tags[0] === 'UH') {
      return resolve(parsedInput.tokens[0] + '!');
    }

    if (conversation.inputs.length === 0) {
      return resolve('Thanks');
    } else if (conversation.inputs.length > 20) {
      return resolve('cool');
    } else {
      return resolve('ok');
    }
  });
};

function whatIs(parsedInput) {
  return extractSubject(parsedInput).then(function(subject) {
    log.debug('what is', subject);
    if (!subject) {
      return "huh?";
    }
    return wikidata.search(subject).then(function(results) {
      if (results && results.length > 0) {
        var description = results[0].description;
        if (description && description.indexOf('disambiguation page') !== -1) {
          return "Can you be more specific?";
        }
        return description || 'I don\'t know';
      } else {
        return "What?";
      }
    });
  });
}

function doYou(parsedInput) {
  return Promise.resolve('do you?');
}

function extractSubject(parsedInput) {
  return new Promise(function(resolve, reject) {

    var firstNounIndex = _.indexOf(parsedInput.tags, 'NN');
    if (firstNounIndex === -1) {
      firstNounIndex = _.indexOf(parsedInput.tags, 'NP');
    }
    if (firstNounIndex === -1) {
      firstNounIndex = _.indexOf(parsedInput.tags, 'RB');
    }
    if (firstNounIndex === -1) {
      firstNounIndex = parsedInput.tags.length - 1;
    }
    if (firstNounIndex !== -1) {
      log.debug('firstNounIndex', firstNounIndex);
      var firstNoun = parsedInput.tokens[firstNounIndex];
      return resolve(firstNoun);
    }
    return resolve('');
  });
}