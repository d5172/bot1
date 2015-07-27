'use strict';

var Promise = require('bluebird');
var MongoClient = require('mongodb').MongoClient;
var log = require('./log').getLogger('db');
var config = require('./config.json');

exports.connect = connect;

function connect() {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(config.mongodb.uri, function(err, db) {
      if (err) {
        return reject(err);
      }
      log.trace('connected to mongodb', config.mongodb.uri);
      resolve(db);
    });
  });
}