import EventEmitter from 'EventEmitter';
import Redis from 'redis';

export default class EventProcessor extends EventEmitter {
  constructor(redisOptions) {
    this.redis = Redis.createConnection(redisOptions);
  }

  processEvent(data) {
    this.redis.set(data.Symbol, data);
  }
}
