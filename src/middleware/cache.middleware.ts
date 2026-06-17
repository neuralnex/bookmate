import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache (for development/production with small datasets)
// For production with large datasets, use Redis
interface CacheEntry {
  data: any;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60 * 1000) {
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// Singleton cache instance
export const cache = new MemoryCache();

// Cache middleware factory
export const cacheMiddleware = (options: {
  ttl?: number;
  key?: (req: Request) => string;
  skip?: (req: Request) => boolean;
} = {}) => {
  const { ttl = 60 * 1000, key: getKey, skip } = options;

  const defaultKey = (req: Request): string => {
    return `${req.method}:${req.originalUrl}`;
  };

  const getCacheKey = getKey || defaultKey;

  return (req: Request, res: Response, next: NextFunction): any => {
    // Skip if explicitly requested
    if (skip && skip(req)) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = getCacheKey(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      console.log(`Cache hit for: ${cacheKey}`);
      return res.status(200).json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = (data: any): Response => {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
        console.log(`Cached response for: ${cacheKey}`);
      }
      return originalJson.call(res, data);
    };

    next();
  };
};

// Clear cache on mutations (POST, PUT, DELETE, PATCH)
export const clearCacheMiddleware = (patterns: RegExp[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Clear all cache if no patterns specified
      if (patterns.length === 0) {
        cache.clear();
        console.log('Cache cleared due to mutation');
        return next();
      }

      // Clear cache for matching patterns
      for (const pattern of patterns) {
        for (const [key] of cache['cache'].entries()) {
          if (pattern.test(key)) {
            cache.delete(key);
            console.log(`Cache cleared for pattern: ${pattern}`);
          }
        }
      }
    }
    next();
  };
};
