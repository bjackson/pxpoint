const _ = require('lodash');
const EventProcessor = require('./eventProcessor');
const RequestProcessor = require('./requestProcessor');
const OrderBook = require('./orderBook');

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

let orderBook = new OrderBook(redisOptions);

let requestProcessor = new RequestProcessor(orderBook, redisOptions);

let coinbase = new Coinbase(coinbaseOptions);

coinbase.connect();
coinbase.createOrderBook();

coinbase.on('message', message => {
  // console.log(message);
  eventProcessor.processIncrementalUpdate(message);
});

coinbase.on('error', err => console.log(err));


// eventProcessor.on('orderBook', book => console.log(book));
