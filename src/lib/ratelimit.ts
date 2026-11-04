// src/lib/ratelimit.ts

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) rateLimitMap.delete(key);
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { success: true, limit, remaining: limit - record.count, resetTime: record.resetTime };
}
