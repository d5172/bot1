'use strict';
var wikidata = require('./wikidata');
var Promise = require('bluebird');
var log = require('./log').getLogger('bot');
var _ = require('lodash');
var openNLP = require('opennlp');
var conversations = [];

module.exports.process = function(input, person) {
  return Promise.try(function() {
    return inConversation(person).then(function(conversation) {
      var handler = isQuestion(input) ? handleQuestion : handleStatement;
      return handler(input, conversation).then(function(reply) {
        trackReply(conversation, input, reply);
        return reply;
      });
    });
  }).catch(function(err) {
    log.error('processing "' + input + '"', err);
    return 'That does not compute.';
  });
};

function trackReply(conversation, input, reply) {
  conversation.inputs.push(input);
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

function isQuestion(input) {
  return _.endsWith(input.trim(), '?');
}

var handleQuestion = function(input, conversation) {
  var cleanedInput = input.trim().toLowerCase();
  if (_.startsWith(cleanedInput, 'what')) {
    return whatIs(cleanedInput);
  } else if (_.startsWith(cleanedInput, 'who')) {
    return whatIs(cleanedInput);
  } else if (_.startsWith(cleanedInput, 'why')) {
    return whatIs(cleanedInput);
  } else if (_.startsWith(cleanedInput, 'when')) {
    return whatIs(cleanedInput);
  } else if (_.startsWith(cleanedInput, 'where')) {
    return whatIs(cleanedInput);
  } else if (_.startsWith(cleanedInput, 'how')) {
    return whatIs(cleanedInput);
  } else {
    return whatIs(cleanedInput);
  }
}

var handleStatement = function(input, conversation) {
  return new Promise(function(resolve, reject) {
    if (conversation.inputs.length === 0) {
      var firstName = person.split('.')[0];
      return resolve('Thanks, ' + firstName);
    } else if (conversation.inputs.length > 20) {
      return resolve('cool');
    } else {
      return resolve('ok');
    }
  });
}

function whatIs(input) {
  return extractSubject(input).then(function(subject) {
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

function extractSubject(sentence) {
  return new Promise(function(resolve, reject) {
    var posTagger = new openNLP().posTagger;

    var tokenizer = new openNLP().tokenizer;
    tokenizer.tokenize(sentence, function(err, tokens) {
      if (err) {
        return reject(err);
      }
      log.debug('tokenize', tokens);

      posTagger.tag(sentence, function(err, tags) {
        if (err) {
          return reject(err);
        }
        log.debug('tagged %s', sentence, tags);

        var firstNounIndex = _.indexOf(tags, 'NN');
        if (firstNounIndex === -1) {
          firstNounIndex = _.indexOf(tags, 'NP');
        }
        if (firstNounIndex === -1) {
          firstNounIndex = _.indexOf(tags, 'RB');
        }
        if (firstNounIndex === -1) {
          firstNounIndex = tags.length - 1;
        }
        if (firstNounIndex !== -1) {
          log.debug('firstNounIndex', firstNounIndex);
          var firstNoun = tokens[firstNounIndex];
          return resolve(firstNoun);
        }
        return resolve('');
      });
    });
  });


}