'use strict';
var wikidata = require('./wikidata');
var Promise = require('bluebird');
var log = require('./log').getLogger('bot');
var _ = require('lodash');
var openNLP = require('opennlp');
var conversations = [];

var greetings = ['hi', 'hello', 'hey'];

module.exports.process = function(input, person) {
  return Promise.try(function() {
    return parseInput(input).then(function(parsedInput) {
      return inConversation(person).then(function(conversation) {
        var handler = parsedInput.isQuestion ? handleQuestion : handleStatement;
        return handler(parsedInput, conversation).then(function(reply) {
          trackReply(conversation, parsedInput, reply);
          return reply;
        });
      });
    });
  }).catch(function(err) {
    log.error('processing "' + input + '"', err);
    return 'That does not compute.';
  });
};

function trackReply(conversation, parsedInput, reply) {
  conversation.inputs.push(parsedInput.originalInput);
  conversation.replies.push(reply);
}

function inConversation(person) {
  if (!person) {
    person = 'anonymous';
  }
  var conversation = conversations[person];
  if (!conversation) {
    conversation = {
      person: person,
      inputs: [],
      replies: []
    };
    conversations.push(conversation);
    log.debug('created new conversation with', person);
  }
  log.debug('in conversation with', person);
  return Promise.resolve(conversation);
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
    var firstName = conversation.person.split('.')[0];

    if (parsedInput.tokens.length > 0 && _.contains(greetings, parsedInput.tokens[0].toLowerCase())) {
      return resolve(parsedInput.tokens[0] + ', ' + firstName + '!');
    }

    if (parsedInput.tags.length > 0 && parsedInput.tags[0] === 'UH') {
      return resolve(parsedInput.tokens[0] + '!');
    }

    if (conversation.inputs.length === 0) {

      return resolve('Thanks, ' + firstName);
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