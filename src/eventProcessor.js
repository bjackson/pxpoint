import EventEmitter from 'events';
import Redis from 'redis';

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
        .zadd(`${message.data.Symbol}-OrderBook-${side}`, message.data.MDEntryPx, JSON.stringify(message.data))
        .exec();
    } else if (message.EventType === 'done') {
      let side = message.data.MDEntryType === 0 ? 'Bid' : 'Offer';
      this.redis.hget(`${message.data.Symbol}-Orders`, message.data.OrderID, (err, order) => {
        if (order) {
          this.redis.multi()
            .hdel(`${message.data.Symbol}-Orders`, message.data.OrderID)
            .zrem(`${message.data.Symbol}-OrderBook-${side}`, order)
            .exec();
        }
      });
    }
  }

  processOrderBookUpdate(symbol) {
    this.redis.zrange()
  }

  processFullRefresh(data) {

  }
}
