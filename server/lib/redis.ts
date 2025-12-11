import IORedis from 'ioredis';

let redisUrl = process.env.REDIS_URL;

// Strip surrounding quotes if present (common copy/paste issue)
if (redisUrl) {
  redisUrl = redisUrl.replace(/^["']+|["']+$/g, '').trim();
}

if (!redisUrl || redisUrl.length < 50) {
  console.warn('[redis] REDIS_URL not set or incomplete - Redis features will be disabled');
}

let redis: IORedis | null = null;
let redisDisabled = false;

if (redisUrl && redisUrl.length >= 50) {
  try {
    const url = new URL(redisUrl);
    const password = decodeURIComponent(url.password);
    const host = url.hostname;
    const port = parseInt(url.port) || 6379;
    
    console.log('[redis] Connecting to:', host, 'port:', port);
    
    redis = new IORedis({
      host,
      port,
      password,
      username: url.username || 'default',
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 2 || redisDisabled) {
          return null;
        }
        return Math.min(times * 500, 2000);
      },
    });
    
    redis.on('ready', () => {
      console.log('[redis] Redis connection ready');
    });
    
    redis.on('error', (err) => {
      if (err.message.includes('WRONGPASS') || err.message.includes('invalid')) {
        if (!redisDisabled) {
          console.error('[redis] Authentication failed - disabling Redis. Check REDIS_URL secret.');
          redisDisabled = true;
          redis?.disconnect();
          redis = null;
        }
      }
    });
  } catch (err: any) {
    console.error('[redis] Failed to parse URL:', err.message);
    redis = null;
  }
}

export default redis;
