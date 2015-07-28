'use strict';
var parseString = require('xml2js').parseString;
var request = require('request');
var Promise = require('bluebird');
var config = require('./config.json');
var log = require('./log').getLogger('wolfram-alpha');
var util = require('util');

module.exports.query = function(input) {
  log.debug('querying wolfram-alpha', input);
  return new Promise(function(resolve, reject) {
    var url = 'http://api.wolframalpha.com/v2/query?input=' + encodeURIComponent(input) + '&appid=' + config.wolfram.appId + '&format=plaintext&includepodid=result';
    log.trace(url);
    request(url, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        log.trace(body);
        parseResult(body)
          .then(extractResults)
          .then(resolve);
      } else {
        return reject(new Error(error));
      }
    });
  });
};

function parseResult(responseBody) {
  return new Promise(function(resolve, reject) {
    parseString(responseBody, function(err, result) {
      if (err) {
        return reject(err);
      }
      log.trace('parse result', util.inspect(result, {
        depth: null
      }));
      return resolve(result);
    });
  });
}

function extractResults(parsedResult) {
  var result = '';
  if (parsedResult.queryresult.$.success) {
    if (parsedResult.queryresult.$.numpods !== '0') {
      var pod = parsedResult.queryresult.pod[0];
      if (pod.plaintext && pod.plaintext.length > 0) {
        result = pod.plaintext[0];
      } else if (pod.subpod && pod.subpod.length > 0) {
        if (pod.subpod[0].plaintext && pod.subpod[0].plaintext.length > 0) {
          result = pod.subpod[0].plaintext[0];
        }
      }
    }
  }
  log.debug('wolfram-alpha result', result || '(empty');
  return Promise.resolve(result);
}

//http://api.wolframalpha.com/v2/query?input=what+is+the+largest+country&appid=G4X7VJ-4E9UYGGQVP&format=plaintext&includepodid=result

// <queryresult success="true" error="false" numpods="1" datatypes="Country" timedout="" timedoutpods="" timing="0.98" parsetiming="0.581" parsetimedout="false" recalculate="" id="MSPa4721h28f00bf6ei6i7g000062597f52i23ff57a" host="http://www5b.wolframalpha.com" server="11" related="http://www5b.wolframalpha.com/api/v2/relatedQueries.jsp?id=MSPa4731h28f00bf6ei6i7g000029g549hc3ba8da00&s=11" version="2.6">
// <pod title="Result" scanner="Ordinal" id="Result" position="100" error="false" numsubpods="1" primary="true">
// <subpod title="">
// <plaintext>Russia (6.593 million mi^2 (square miles))</plaintext>
// </subpod>
// </pod>
// <assumptions count="1">
// <assumption type="SubCategory" word="largest" template="Assuming "${word}" refers to ${desc1}. Use ${desc2} instead" count="3">
// <value name="Area" desc="total area" input="*DPClash.CountryP.largest-_*Area-"/>
// <value name="GDPUSD" desc="GDP" input="*DPClash.CountryP.largest-_*GDPUSD-"/>
// <value name="Population" desc="population" input="*DPClash.CountryP.largest-_*Population-"/>
// </assumption>
// </assumptions>
// <sources count="1">
// <source url="http://www.wolframalpha.com/sources/CountryDataSourceInformationNotes.html" text="Country data"/>
// </sources>
// </queryresult>