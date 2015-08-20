import EventEmitter from 'events';
import Redis from 'redis';

export default class EventProcessor extends EventEmitter {
  constructor(redisOptions) {
    super();
    this.redis = Redis.createClient(redisOptions);
  }

  processEvent(message) {
    if (message.eventType === 'match') {
      console.log(message);
    }
    this.redis.set(message.data.Symbol, JSON.stringify(message.data));
  }
}
