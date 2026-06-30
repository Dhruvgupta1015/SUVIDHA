import Redis from 'ioredis';
import * as Sentry from '@sentry/node';

// Simple in-memory fallback mimicking basic Redis operations for robust local dev
class MockRedis {
  constructor() {
    this.store = new Map();
  }
  
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  
  async setex(key, seconds, value) {
    this.store.set(key, { value: value.toString(), expiry: Date.now() + (seconds * 1000) });
    return 'OK';
  }

  // ioredis uses setEx or setex (lowercase) depending on versions, fallback to support both
  async setEx(key, seconds, value) {
    return this.setex(key, seconds, value);
  }
  
  async incr(key) {
    const val = await this.get(key);
    const newVal = val ? parseInt(val) + 1 : 1;
    const current = this.store.get(key);
    this.store.set(key, { 
      value: newVal.toString(), 
      expiry: current?.expiry || (Date.now() + 3600000) 
    });
    return newVal;
  }
  
  async del(key) {
    const existed = this.store.has(key);
    this.store.delete(key);
    return existed ? 1 : 0;
  }

  async lpush(key, ...values) {
    const current = this.store.get(key) ? JSON.parse(this.store.get(key).value) : [];
    current.unshift(...values);
    this.store.set(key, { value: JSON.stringify(current) });
    return current.length;
  }

  async ltrim(key, start, stop) {
    let current = this.store.get(key) ? JSON.parse(this.store.get(key).value) : [];
    current = current.slice(start, stop === -1 ? undefined : stop + 1);
    this.store.set(key, { value: JSON.stringify(current) });
    return 'OK';
  }

  // Stub pubsub events so adapter doesn't crash on mock
  on() {}
  subscribe() {}
  publish() {}
}

let redisClient = null;

/**
 * Main initializer for standard cache operations.
 */
export const initRedis = () => {
  if (process.env.REDIS_URI) {
    try {
      const client = new Redis(process.env.REDIS_URI);
      client.on('connect', () => console.log('[Redis] Connected to Production Cache via ioredis'));
      client.on('error', (err) => {
        console.error('[Redis] Client Error', err.message);
        Sentry.captureException(err);
      });
      redisClient = client;
      return;
    } catch (err) {
      console.warn('[Redis] Connection failed. Falling back to in-memory store.', err.message);
    }
  } else {
    console.warn('[Redis] No REDIS_URI provided. Using in-memory fallback for local development.');
  }
  
  redisClient = new MockRedis();
};

/**
 * Returns the primary Redis client.
 */
export const getRedis = () => {
  if (!redisClient) {
    redisClient = new MockRedis();
  }
  return redisClient;
};

/**
 * Returns a new Redis client specifically for Pub/Sub or scaling adapters.
 */
export const createRedisClient = () => {
  if (process.env.REDIS_URI) {
    return new Redis(process.env.REDIS_URI);
  }
  return new MockRedis();
};
