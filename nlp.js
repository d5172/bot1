var openNLP = require('opennlp');

var sentence = 'Pierre Vinken , 61 years old , will join the board as a nonexecutive director Nov. 29 .';

var tokenizer = new openNLP().tokenizer;
tokenizer.tokenize(sentence, function(err, results) {
    console.log('tokenize', results)
});

var nameFinder = new openNLP().nameFinder;
nameFinder.find(sentence, function(err, results) {
    console.log('nameFinder', results)
});

var posTagger = new openNLP().posTagger;
posTagger.tag(sentence, function(err, results) {
    console.log('posTagger', results)
});

var sentenceDetector = new openNLP().sentenceDetector;
sentenceDetector.sentDetect(sentence, function(err, results) {
    console.log('sentDetect', results)
});


var posTagger = new openNLP().posTagger;
var chunker = new openNLP().chunker;
posTagger.tag(sentence, function(err, tokens) {
    chunker.chunk(sentence, tokens, function(err, results) {
        console.log('posTagger - chunk', results)
    });
});