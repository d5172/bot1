'use strict';
var Promise = require('bluebird');
var request = require('request');

module.exports.search = function(term) {
  if (!term) {
    return Promise.resolve('');
  }
  return get('wbsearchentities', 'search=' + term + '&language=en').then(function(result) {
    return result.search;
  });
};

module.exports.getEntity = function(id) {
  return get('wbgetentities', 'ids=' + id).then(function(result) {
    return result.entities[id];
  });
};

function get(action, params) {
  return new Promise(function(resolve, reject) {
    var url = 'https://www.wikidata.org/w/api.php?format=json&action=' + action + '&' + params;
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        return resolve(JSON.parse(body));
      } else {
        return reject(new Error(error));
      }
    });
  });
}