'use strict';
var wikidata = require('./wikidata');
var Promise = require('bluebird');
var log = require('./log').getLogger('bot');

module.exports.process = function(input) {
  return Promise.try(function() {
    return wikidata.search(input).then(function(results) {
      if (results && results.length > 0) {
        return results[0].description;
      } else {
        return "What?";
      }
    });
  }).catch(function(err) {
    log.error('processing "' + input + '"', err);
    return 'hmm...';
  });
};