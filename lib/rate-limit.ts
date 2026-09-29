interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter
 * @param ip Identifier (IP or route+IP)
 * @param maxHits Maximum allowed requests in window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(ip: string, maxHits = 10, windowMs = 60 * 1000): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: maxHits - 1,
      reset: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= maxHits) {
    return {
      success: false,
      remaining: 0,
      reset: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: maxHits - record.count,
    reset: Math.ceil((record.resetTime - now) / 1000),
  };
}
