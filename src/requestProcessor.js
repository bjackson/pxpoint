const _ = require('lodash');
import * as ws from 'ws';
import Redis from 'redis';
import Uuid from 'uuid';
import EventEmitter from 'events';

const wsServer = ws.Server;

export default class RequestProcessor extends EventEmitter {
  constructor(orderBook, redisOptions) {
    super();
    this.orderBook = orderBook;
    this.redis = Redis.createClient(redisOptions);

    this.server = new wsServer({
      port: 11789
    });

    this.sockets = {};

    this.server.on('connection', socket => {
      socket.id = Uuid.v4();
      this.sockets[socket.id] = socket;
      console.log(`Client connected. UUID: ${socket.id}`);

      socket.on('message', message => {
        this.handleMessage(socket, message);
      });

      socket.on('close', () => this.onSocketDisconnect(socket));
    });

    this.on('update', update => this.processUpdate(update));
  }

  onSocketDisconnect(socket) {
    console.log(`Client disconnected. UUID: ${socket.id}`);
    delete this.sockets[socket];
  }

  handleRequest(socket, message) {
    let symbol = message.Symbol;
    let market = message.MDMkt;

    if (message.requestType == 'GetOrderBook') {
      this.getOrderBookForSymbol(socket, symbol, market);
      return;
    }

    if (message.requestType == 'SubscribeToSymbol') {
      this.subscribeToSymbol(socket, symbol);
    }

    if (message.requestType == 'UnsubscribeToSymbol') {
      this.unsubscribeToSymbol(socket, symbol);
    }
  }

  handleMessage(socket, message) {
    message = JSON.parse(message);

    if (message.eventType == 'request') {
      this.handleRequest(socket, message);
    }
  }

  getOrderBookForSymbol(socket, symbol, market) {
    this.orderBook.getOrderBookForSymbol(symbol, market)
      .then(book => {
        this.sendToSocket(socket, book);
      })
      .catch(err => {
        console.log(err);
        this.sendToSocket(socket, err);
      });
  }

  subscribeToSymbol(socket, symbol) {
    this.redis.hset(`${symbol}:Subscribers`, socket.id, JSON.stringify({type: 'all'}));
  }

  unsubscribeToSymbol(socket, symbol) {
    this.redis.hdel(`${symbol}:Subscribers`, socket.id);
  }

  processUpdate(update) {
    if (update.socketID) {
      this.sendToSocket(this.sockets[socketID], update);
    } else {
      let symbol = update.body.data.Symbol;
      this.redis.hkeys(`${symbol}:Subscribers`, (err, subscriberIds) => {
        let socketsToUpdate =
          _(subscriberIds)
          .map(subId => this.sockets[subId])
          .value();
        socketsToUpdate.forEach(socket => {
          if (socket) {
            this.sendToSocket(socket, update);
          }
        });
      });
    }
  }

  sendToSocket(socket, message) {
    try {
      socket.send(JSON.stringify(message));
    } catch (e) {
      if (e.name === 'not opened') {
        this.onSocketDisconnect(socket);
      }
    } finally {

    }
  }
}
