'use strict';

var Promise = require('bluebird');
var log = require('./log').getLogger('conversations');
var db = require('./db');

var convHash = {};

exports.init = function() {
  db.connect().then(function(conn) {
    var collection = conn.collection('conversations');
    collection.ensureIndex({
      context: 1
    }, {
      unique: true
    }).then(function(val) {
      log.debug('conversations initialized', val);
      conn.close();
    });
  });
};

exports.establish = function(context) {
  if (!context) {
    context = 'anonymous';
  }
  if (convHash[context]) {
    return Promise.resolve(convHash[context]);
  }
  return db.connect().then(function(conn) {
    var collection = conn.collection('conversations');
    return collection.findOne({
      context: context
    }).then(function(conversation) {
      if (conversation) {
        log.debug('resuming conversation in %s', context);
        conn.close();
      } else {
        conversation = {
          context: context,
          inputs: [],
          replies: []
        };
        collection.insertOne(conversation).then(function() {
          log.debug('created new conversation in %s', context);
          conn.close();
        });
      }
      convHash[context] = conversation;
      return conversation;
    });
  });
};

exports.add = function(conversation) {
  return db.connect().then(function(conn) {
    var collection = conn.collection('conversations');
    return collection.insertOne(conversation).then(function() {
      conn.close();
      convHash.context = conversation;
    });
  });
};

exports.track = function(conversation, input, reply) {
  log.debug('tracking', conversation.context);
  conversation.inputs.push(input);
  conversation.replies.push(reply);
  return db.connect().then(function(conn) {
    var collection = conn.collection('conversations');
    return collection.updateOne({
      context: conversation.context
    }, {
      $push: {
        inputs: input,
        replies: reply
      }
    }, {}).then(function(val) {
      log.trace('tracked', val.result.nModified === 1);
      conn.close();
    });
  });

};