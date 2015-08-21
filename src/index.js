const _ = require('lodash');
const EventProcessor = require('./eventProcessor');

let Coinbase = require('pxpoint-coinbase');

let redisOptions = {
  host: 'localhost',
  port: 6379
};

let coinbaseOptions = {
  products: ['BTC-USD', 'BTC-EUR', 'BTC-GBP']
};

let epOptions = {
  orderBookSize: 10
};

let eventProcessor = new EventProcessor(redisOptions);

let coinbase = new Coinbase(coinbaseOptions);

coinbase.connect();
coinbase.createOrderBook();

coinbase.on('message', message => {
  eventProcessor.processIncrementalUpdate(message);
});

coinbase.on('error', err => console.log(err));

// eventProcessor.on('orderBook', book => console.log(book));
