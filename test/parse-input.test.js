'use strict';

var chai = require('chai');
chai.use(require('chai-as-promised'));
//chai.use(require('sinon-chai'));
var expect = chai.expect;

var parseInput = require('../parse-input');

var statement1 = 'The quick brown fox jumps over the lazy dog.';

var questions = [
  'What is your name?',
  'Who is John Galt',
  'Where is the bridge.',
  'How are you?',
  'When were you born?',
  'Do you like green eggs and ham?',
  'Why is the sky blue?'
];

describe('parse-input', function() {

  describe.only('given questions', function() {
    questions.forEach(function(q) {
      it('recognizes ' + q, function(done) {
        parseInput(q).then(function(parsed) {
          expect(parsed.isQuestion).to.equal(true, q);
        }).finally(done);
      });
    });

  });

  describe('given a sentence', function() {

    it('returns an object', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed).to.be.an('object');
      }).finally(done);
    });

    it('returns an object with the original input as a property', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed.originalInput).to.eql(statement1);
      }).finally(done);
    });

    it('returns an object with an array of tokens', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed.tokens).to.be.an('array');
      }).finally(done);
    });

    it('returns an object with an array of tags', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed.tags).to.be.an('array');
      }).finally(done);
    });

    it('extracts tokens', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed.tokens).to.eql(['The', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog', '.']);
      }).finally(done);
    });

    it('makes tags', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed.tags).to.eql(['DT', 'JJ', 'JJ', 'NN', 'NNS', 'IN', 'DT', 'JJ', 'NN']);
      }).finally(done);
    });

    it('sets isQuestion to false', function(done) {
      parseInput(statement1).then(function(parsed) {
        expect(parsed.isQuestion).to.equal(false);
      }).finally(done);
    });

  });



  describe('given an empty string', function() {
    it('returns an object', function(done) {
      parseInput('').then(function(parsed) {
        expect(parsed).to.be.an('object');
      }).finally(done);
    });

    it('returns an object with the original input as a property', function(done) {
      parseInput('').then(function(parsed) {
        expect(parsed.originalInput).to.eql('');
      }).finally(done);
    });


    it('returns an object with an empty array of tokens', function(done) {
      parseInput('').then(function(parsed) {
        expect(parsed.tokens).to.eql([]);
      }).finally(done);
    });


    it('returns an object with an empty array of tags', function(done) {
      parseInput('').then(function(parsed) {
        expect(parsed.tags).to.eql(['NN']);
      }).finally(done);
    });
  });


});