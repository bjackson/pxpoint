const _ = require('lodash');

import * as ws from 'ws';
const wsServer = ws.Server;

export default class RequestProcessor {
  constructor(orderBook) {
    this.orderBook = orderBook;

    this.server = new wsServer({
      port: 11789
    });

    this.server.on('connection', socket => {
      console.log('Client connected.');

      socket.on('message', message => {
        this.handleMessage(socket, message);
      });
    });
  }

  handleRequest(socket, message) {
    if (message.requestType == 'GetOrderBook') {
      let symbol = message.Symbol;
      this.orderBook.getOrderBookForSymbol(symbol)
        .then(book => {
          socket.send(JSON.stringify(book));
        })
        .catch(err => {
          console.log(err);
          socket.send(err);
        });
    }
  }

  handleMessage(socket, message) {
    message = JSON.parse(message);

    if (message.eventType == 'request') {
      this.handleRequest(socket, message);
    }
  }
}
