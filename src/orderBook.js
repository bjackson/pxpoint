import EventEmitter from 'events';
import Redis from 'redis';
import _ from 'lodash';
import async from 'async';

export default class OrderBook {
  constructor(redisOptions) {
    this.redis = Redis.createClient(redisOptions);
  }

  getOrderBookForSymbol(symbol) {
    return new Promise((resolve, reject) => {
      async.parallel({
        bid: callback => {
          this.redis.zrevrange(`${symbol}-Ranked-Bid`, 0, 30, (err, orders) => {
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
          this.redis.zrange(`${symbol}-Ranked-Offer`, 0, 30, (err, orders) => {
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
        if (err) {
          reject(err);
        } else {
          resolve(book);
        }
      });
    });
  }
}
