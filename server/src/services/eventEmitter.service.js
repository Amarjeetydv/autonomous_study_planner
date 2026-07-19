const EventEmitter = require('events');

class CentralizedEventEmitter extends EventEmitter {
  constructor() {
    super();
    // Increase limit if many streams listen concurrently
    this.setMaxListeners(100);
  }
}

const eventEmitterInstance = new CentralizedEventEmitter();

module.exports = eventEmitterInstance;
