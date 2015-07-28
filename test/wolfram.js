var wolfram = require('../wolfram-alpha');
var repl = require('repl');

repl.start({
  ignoreUndefined: true,
  eval: function(cmd, context, filename, callback) {
    var input = cmd.replace('\n', '').replace('(', '').replace(')', '');
    wolfram.query(input).then(function(response) {
      console.log(response);
    });
  }
});
console.log('enter text to query wolfram-alpha');