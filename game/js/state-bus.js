/**
 * Enhanced state/event bus. Replaces the inline stub once the loader pulls it in.
 */
(function initStateBus() {
  if (window.__STATE_BUS_READY__) return;

  class StateBus {
    constructor() {
      this.channels = new Map();
    }

    publish(topic, payload) {
      const listeners = this.channels.get(topic);
      if (!listeners) return;
      for (const listener of Array.from(listeners)) {
        try {
          listener(payload);
        } catch (error) {
          console.error("[StateBus]", topic, error);
        }
      }
    }

    subscribe(topic, handler) {
      const listeners = this.channels.get(topic) || new Set();
      listeners.add(handler);
      this.channels.set(topic, listeners);
      return () => listeners.delete(handler);
    }

    once(topic, handler) {
      const unsubscribe = this.subscribe(topic, (payload) => {
        handler(payload);
        unsubscribe();
      });
      return unsubscribe;
    }

    snapshot() {
      const result = {};
      this.channels.forEach((set, key) => (result[key] = set.size));
      return result;
    }
  }

  window.A1KBus = new StateBus();
  window.__STATE_BUS_READY__ = true;
  window.A1KBus.publish("bus:ready", {});
})();
