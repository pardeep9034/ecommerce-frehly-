import Redis from 'ioredis';
import { env } from './env.js';

class RedisManager {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (this.client) return this.client;

    const config = env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    };

    this.client = new Redis(config, {
      maxRetriesPerRequest: null,
      enableEvents: true,
    });

    this.client.on('connect', () => {
      console.log('✅ Auth Service: Connected to Redis');
    });

    this.client.on('error', (err) => {
      // console.error('❌ Auth Service: Redis error:', err.message);
    });

    return this.client;
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  } 
}



export default new RedisManager();
