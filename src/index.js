const _ = require('lodash');
const EventProcessor = require('./eventProcessor');

let Coinbase = require('pxpoint-coinbase');

let redisOptions = {
  host: 'localhost',
  port: 6379
};

let eventProcessor = new EventProcessor(redisOptions);

let coinbase = new Coinbase();

coinbase.on('message', (message) => {
  eventProcessor.processEvent(message);
});
