'use strict';
var Promise = require('bluebird');
var openNLP = require('opennlp');
var _ = require('lodash');
var log = require('./log').getLogger('parse-input');

module.exports = function(input) {
  return new Promise(function(resolve, reject) {
    var parsed = {
      originalInput: input,
      cleanedInput: input.trim().toLowerCase()
    };
    var posTagger = new openNLP().posTagger;
    var tokenizer = new openNLP().tokenizer;
    var trimmed = input.trim();
    tokenizer.tokenize(trimmed, function(err, tokens) {
      if (err) {
        return reject(err);
      }
      log.debug('tokenize', tokens);
      parsed.tokens = tokens;
      posTagger.tag(trimmed, function(err, tags) {
        if (err) {
          return reject(err);
        }
        log.debug('tagged %s', input, tags);
        parsed.tags = tags;

        if (tags.length > 0) {
          parsed.isQuestion = _.startsWith(tags[0], 'W') || _.endsWith(trimmed, '?');
        }

        return resolve(parsed);
      });
    });
  });
};