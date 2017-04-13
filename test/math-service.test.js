// SEE: https://www.npmjs.com/package/mountebank-helper

// import the mountebank helper library
const mbHelper = require('mountebank-helper');

// create the skeleton for the imposter (does not post to MB)
const graphImposter = new mbHelper.Imposter({
  'imposterPort': 3000
});

// construct sample responses and conditions on which to send it
const graph_response = {
  'uri': '/api/graph',
  'verb': 'POST',
  'res': {
    'statusCode': 200,
    'responseHeaders': {
      'Content-Type': 'application/json'
    },
    // YAML response expected
    'responseBody': JSON.stringify({
      'hello': 'world'
    })
  }
};

// add our responses to our imposter
graphImposter.addRoute(graph_response);

// start the MB server  and post our Imposter to listen!
mbHelper.startMbServer(2525)
  .then(function () {
    graphImposter.postToMountebank()
      .then((res) => {
        console.log('Imposter Posted!', res);
      });
  });