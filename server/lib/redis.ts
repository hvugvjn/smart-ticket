import IORedis from 'ioredis';

let redisUrl = process.env.REDIS_URL;

// Strip surrounding quotes if present (common copy/paste issue)
if (redisUrl) {
  // Remove quotes from start/end and any trailing whitespace
  redisUrl = redisUrl.replace(/^["']+|["']+$/g, '').trim();
}

if (!redisUrl) {
  console.warn('[redis] REDIS_URL not set - Redis features will be disabled');
}

let redis: IORedis | null = null;

if (redisUrl) {
  try {
    // Parse the URL to extract components
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
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    
    redis.on('connect', () => {
      console.log('[redis] Connected to Upstash Redis');
    });
    
    redis.on('ready', () => {
      console.log('[redis] Redis connection ready');
    });
    
    redis.on('error', (err) => {
      console.error('[redis] Connection error:', err.message);
    });
  } catch (err: any) {
    console.error('[redis] Failed to parse URL:', err.message);
  }
}

export default redis;
