import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Criar cliente Redis
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit para login: 5 tentativas a cada 15 minutos
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"),
  prefix: "ratelimit:login",
});

// Rate limit para API em geral: 100 requests por minuto
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "ratelimit:api",
});

// Rate limit para criação de agendamentos: 3 por hora
export const bookingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "ratelimit:booking",
});