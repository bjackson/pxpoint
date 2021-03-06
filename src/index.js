const _ = require('lodash');
import EventProcessor from './eventProcessor';
import RequestProcessor from './requestProcessor';
import OrderBook from './orderBook';
import * as config from './config';
// import * as OKCoin from 'pxpoint-okcoin';

// let Coinbase = require('pxpoint-coinbase');
import Coinbase from 'pxpoint-coinbase';

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

// let okcoin = new OKCoin(config.keys.coinbase);

// okcoin.on('message', message => {
//   // console.log(message);
//   eventProcessor.processIncrementalUpdate(message);
//   let update = {body: message};
//   requestProcessor.processUpdate(update);
// });

// okcoin.on('new-trade', trade => console.log(trade));
// okcoin.on('new-book', book => console.log(book));

// okcoin.on('error', err => console.log(err));

coinbase.on('message', message => {
  // console.log(message);
  eventProcessor.processIncrementalUpdate(message);
  let update = {body: message};
  requestProcessor.processUpdate(update);
});

coinbase.on('error', err => console.log(err));


eventProcessor.on('orderBook', book => console.log(book));
