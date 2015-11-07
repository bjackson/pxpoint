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
    if (message.eventType === 'open') {
      let side = message.data.MDEntryType === 0 ? 'Bid' : 'Offer';
      this.redis.multi()
        .hset(`${message.data.Symbol}-Orders`, message.data.OrderID, JSON.stringify(message.data))
        .zadd(`${message.data.Symbol}-Ranked-${side}`, message.data.MDEntryPx, JSON.stringify(message.data))
        .exec(() => this.processOrderBookUpdate(message.data.Symbol));
    } else if (message.EventType === 'done') {
      let side = message.data.MDEntryType === 0 ? 'Bid' : 'Offer';
      this.redis.hget(`${message.data.Symbol}-Orders`, message.data.OrderID, (err, order) => {
        if (order) {
          this.redis.multi()
            .hdel(`${message.data.Symbol}-Orders`, message.data.OrderID)
            .zrem(`${message.data.Symbol}-Ranked-${side}`, order)
            .exec(() => this.processOrderBookUpdate(message.data.Symbol));
        }
      });
    }
  }

  processOrderBookUpdate(symbol, numberOfEntries) {
    async.parallel({
      bid: callback => {
        this.redis.zrevrange(`${symbol}-Ranked-Bid`, 0, numberOfEntries, (err, orders) => {
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
        this.redis.zrange(`${symbol}-Ranked-Offer`, 0, numberOfEntries, (err, orders) => {
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
      this.redis.set(`${symbol}-OrderBook`, JSON.stringify(book));
      this.emit('orderBook', {Symbol: symbol, data: book});
    });
  }

  processFullRefresh(data) {

  }
}
