export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AuthError extends AppError {
  constructor(message = 'Yetkisiz erişim') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterMs: number) {
    super(429, 'RATE_LIMITED', 'İstek limiti aşıldı');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class NoAvailableModelError extends AppError {
  constructor() {
    super(503, 'NO_AVAILABLE_MODEL', 'Tüm modeller şu anda kullanılamıyor');
  }
}

export class ProviderRequestError extends AppError {
  constructor(
    message: string,
    public readonly provider: string,
  ) {
    super(502, 'PROVIDER_ERROR', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} bulunamadı`);
  }
}
