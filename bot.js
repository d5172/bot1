'use strict';

var Promise = require('bluebird');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var log = require('./log').getLogger('bot');
var _ = require('lodash');
var openNLP = require('opennlp');
var wikidata = require('./wikidata');

var greetings = ['hi', 'hello', 'hey'];

var RESUME_MS = 30000;

module.exports = Bot;

function Bot() {
  this.conversations = [];
  this.timers = [];
}

util.inherits(Bot, EventEmitter);

Bot.prototype.process = function(input, context) {
  var self = this;
  return Promise.try(function() {
    return inConversation(context).then(function(conversation) {
      pauseConversation(conversation);
      return parseInput(input).then(function(parsedInput) {
        var handler = parsedInput.isQuestion ? handleQuestion : handleStatement;
        return handler(parsedInput, conversation).then(function(reply) {
          trackReply(conversation, parsedInput, reply);
          resumeConversation(conversation);
          return reply;
        });
      });
    });
  }).catch(function(err) {
    log.error('processing "' + input + '"', err);
    return 'That does not compute.';
  });

  function inConversation(context) {
    if (!context) {
      context = 'anonymous';
    }
    var conversation = _.find(self.conversations, {
      context: context
    });
    if (!conversation) {
      conversation = {
        context: context,
        inputs: [],
        replies: []
      };
      self.conversations.push(conversation);
      log.debug('created new conversation in %s', context);
    }
    log.debug('in conversation in %s', context);
    return Promise.resolve(conversation);
  }

  function resumeConversation(conversation) {

    var timeout = setTimeout(function(conversation) {
      log.debug('resuming conversation in %s', conversation.context);
      getResumeConversationText(conversation).then(function(text) {
        self.emit('message', {
          context: conversation.context,
          text: text
        });
        pauseConversation(conversation);
      });
    }, RESUME_MS, conversation);

    self.timers.push({
      context: conversation.context,
      timout: timeout
    });

  }

  function pauseConversation(conversation) {
    var timer = _.find(self.timers, {
      context: conversation.context,
    });
    if (timer) {
      clearTimeout(timer.timeout);
    }
  }
};

function getResumeConversationText(conversation) {
  return Promise.resolve('yo');
}

function trackReply(conversation, parsedInput, reply) {
  conversation.inputs.push(parsedInput.originalInput);
  conversation.replies.push(reply);
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

function parseInput(input) {
  return new Promise(function(resolve, reject) {
    var parsed = {
      originalInput: input,
      cleanedInput: input.trim().toLowerCase()
    };
    var posTagger = new openNLP().posTagger;

    var tokenizer = new openNLP().tokenizer;
    tokenizer.tokenize(input, function(err, tokens) {
      if (err) {
        return reject(err);
      }
      log.debug('tokenize', tokens);
      parsed.tokens = tokens;
      posTagger.tag(input, function(err, tags) {
        if (err) {
          return reject(err);
        }
        log.debug('tagged %s', input, tags);
        parsed.tags = tags;

        parsed.isQuestion = _.endsWith(input.trim(), '?'); //TODO - check first tag for wh* 

        return resolve(parsed);
      });
    });
  });
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