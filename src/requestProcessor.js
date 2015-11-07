const _ = require('lodash');
import * as ws from 'ws';
import Redis from 'redis';
import Uuid from 'uuid';

const wsServer = ws.Server;

export default class RequestProcessor {
  constructor(orderBook, redisOptions) {
    this.orderBook = orderBook;
    this.redis = Redis.createClient(redisOptions);

    this.server = new wsServer({
      port: 11789
    });

    this.server.on('connection', socket => {
      socket.id = Uuid.v4();
      console.log(`Client connected. UUID: ${socket.id}`);

      socket.on('message', message => {
        this.handleMessage(socket, message);
      });
    });
  }

  handleRequest(socket, message) {
    let symbol = message.Symbol;

    if (message.requestType == 'GetOrderBook') {
      this.getOrderBookForSymbol(socket, symbol);
      return;
    }

    if (message.requestType == 'SubscribeToSymbol') {
      this.subscribeToSymbol(socket, symbol);
    }
  }

  handleMessage(socket, message) {
    message = JSON.parse(message);

    if (message.eventType == 'request') {
      this.handleRequest(socket, message);
    }
  }

  getOrderBookForSymbol(socket, symbol) {
    this.orderBook.getOrderBookForSymbol(symbol)
      .then(book => {
        socket.send(JSON.stringify(book));
      })
      .catch(err => {
        console.log(err);
        socket.send(err);
      });
  }

  subscribeToSymbol(socket, symbol) {
    this.redis.hset(`${symbol}:Subscribers`, socket.id, 'yes');
  }
}
