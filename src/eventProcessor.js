import EventEmitter from 'events';
import Redis from 'redis';
import _ from 'lodash';
import async from 'async';

export default class EventProcessor extends EventEmitter {
  constructor(redisOptions, options) {
    super();
    this.redis = Redis.createClient(redisOptions);
  }

  processIncrementalUpdate(message) {
    let market = message.data.MDMkt;
    if (message.eventType === 'open') {
      let side = message.data.MDEntryType === 0 ? 'Bid' : 'Offer';
      this.redis.multi()
        .hset(`${message.data.Symbol}:${market}:Orders`, message.data.OrderID, JSON.stringify(message.data))
        .zadd(`${message.data.Symbol}:${market}:Ranked-${side}`, message.data.MDEntryPx, JSON.stringify(message.data))
        .exec(() => this.processOrderBookUpdate(message));
    } else if (message.EventType === 'done') {
      let side = message.data.MDEntryType === 0 ? 'Bid' : 'Offer';
      this.redis.hget(`${message.data.Symbol}:${market}:Orders`, message.data.OrderID, (err, order) => {
        if (order) {
          this.redis.multi()
            .hdel(`${message.data.Symbol}:${market}:Orders`, message.data.OrderID)
            .zrem(`${message.data.Symbol}:${market}:Ranked-${side}`, order)
            .exec(() => this.processOrderBookUpdate(message));
        }
      });
    }
  }

  processOrderBookUpdate(message, numberOfEntries) {
    let symbol = message.data.Symbol;
    let market = message.data.MDMkt;
    async.parallel({
      bid: callback => {
        this.redis.zrevrange(`${symbol}:${market}:Ranked-Bid`, 0, numberOfEntries, (err, orders) => {
          orders = _(orders).map((order) => {
            order = JSON.parse(order);
            return {
              MDEntryPx: order.MDEntryPx,
              MDEntrySize: order.MDEntrySize
            };
          })
          .groupBy('MDEntryPx')
          .mapValues(orders => {
            return _(orders).map(order => order.MDEntrySize)
                    .sum();
          })

          .value();
          callback(null, orders);
        });
      },

      ask: callback => {
        this.redis.zrange(`${symbol}:${market}:Ranked-Offer`, 0, numberOfEntries, (err, orders) => {
          orders = _(orders).map((order) => {
            order = JSON.parse(order);
            return {
              MDEntryPx: order.MDEntryPx,
              MDEntrySize: order.MDEntrySize
            };
          })
          .groupBy('MDEntryPx')
          .mapValues(orders => {
            return _(orders).map(order => order.MDEntrySize)
                    .sum();
          })

          .value();
          callback(null, orders);
        });
      }
    }, (err, book) => {
      this.redis.set(`${symbol}:${market}:OrderBook`, JSON.stringify(book));
      this.emit('orderBook', {Symbol: symbol, data: book});
    });
  }

  processFullRefresh(data) {

  }
}
