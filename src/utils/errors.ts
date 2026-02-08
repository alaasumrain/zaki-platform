/**
 * Error handling utilities for Zaki Platform
 */

export class GatewayError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

export class SandboxError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'SandboxError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public limit?: number,
    public remaining?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string = 'Authentication required',
    public missingField?: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string = 'Request timeout',
    public timeoutMs?: number
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Handle errors and return user-friendly responses
 */
export function handleError(error: unknown): { error: string; message: string; status: number } {
  // Log error for debugging
  console.error('Error:', error);
  
  // Handle specific error types
  if (error instanceof GatewayError) {
    return {
      error: 'Gateway error',
      message: getGatewayErrorMessage(error.statusCode),
      status: error.statusCode
    };
  }
  
  if (error instanceof SandboxError) {
    return {
      error: 'Sandbox error',
      message: 'Failed to communicate with Sandbox. Please try again.',
      status: 503
    };
  }
  
  if (error instanceof RateLimitError) {
    return {
      error: 'Rate limit exceeded',
      message: error.message || 'You\'ve reached your limit. Please upgrade or try again later.',
      status: 429
    };
  }
  
  if (error instanceof AuthenticationError) {
    return {
      error: 'Authentication error',
      message: error.message || 'Please check your API key configuration.',
      status: 401
    };
  }
  
  if (error instanceof TimeoutError) {
    return {
      error: 'Timeout',
      message: 'Request took too long. Please try again.',
      status: 504
    };
  }
  
  // Generic error
  if (error instanceof Error) {
    // Don't expose internal error messages
    return {
      error: 'Internal error',
      message: 'Something went wrong. Please try again later.',
      status: 500
    };
  }
  
  // Unknown error
  return {
    error: 'Unknown error',
    message: 'An unexpected error occurred. Please try again.',
    status: 500
  };
}

/**
 * Get user-friendly error message for Gateway HTTP status codes
 */
function getGatewayErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 401:
      return 'Authentication failed. Please check your API key.';
    case 403:
      return 'Access denied. Please check your permissions.';
    case 404:
      return 'Resource not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'AI service error. The service is temporarily unavailable.';
    case 502:
      return 'Bad gateway. Please try again in a moment.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. Please try again.';
    default:
      return 'An error occurred. Please try again.';
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (error instanceof AuthenticationError || error instanceof RateLimitError) {
        throw error;
      }
      
      // Last attempt, throw error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      // Wait before retry (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Retry failed');
}

/**
 * Create a timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`, timeoutMs));
      }, timeoutMs);
    })
  ]);
}
