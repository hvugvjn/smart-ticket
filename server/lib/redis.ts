import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('[redis] REDIS_URL not set - Redis features will be disabled');
}

const redis = redisUrl 
  ? new IORedis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    })
  : null;

if (redis) {
  redis.on('connect', () => {
    console.log('[redis] Connected to Upstash Redis');
  });
  
  redis.on('ready', () => {
    console.log('[redis] Redis connection ready');
  });
  
  redis.on('error', (err) => {
    console.error('[redis] Connection error:', err.message);
  });
}

export default redis;
