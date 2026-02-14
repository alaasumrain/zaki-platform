/**
 * Health Check Service
 * 
 * Implements health check hierarchy:
 * - Liveness: Is the process alive?
 * - Readiness: Can it handle requests?
 * - Startup: Is it still initializing?
 * 
 * Based on Kubernetes best practices and multi-tenant patterns
 */

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'starting';
  timestamp: string;
  uptime: number;
  checks: {
    liveness: CheckResult;
    readiness: CheckResult;
    startup?: CheckResult;
  };
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  details?: Record<string, unknown>;
}

export class HealthCheckService {
  private startTime: number;
  private isReady: boolean = false;
  private startupGracePeriod: number = 30000; // 30 seconds
  private readinessChecks: Map<string, () => Promise<CheckResult>> = new Map();

  constructor(startupGracePeriodMs: number = 30000) {
    this.startTime = Date.now();
    this.startupGracePeriod = startupGracePeriodMs;
  }

  /**
   * Mark service as ready
   */
  markReady(): void {
    this.isReady = true;
  }

  /**
   * Mark service as not ready
   */
  markNotReady(): void {
    this.isReady = false;
  }

  /**
   * Register a readiness check
   */
  registerReadinessCheck(name: string, check: () => Promise<CheckResult>): void {
    this.readinessChecks.set(name, check);
  }

  /**
   * Liveness check - is the process alive?
   */
  async checkLiveness(): Promise<CheckResult> {
    try {
      // Basic check: process is running
      const uptime = Date.now() - this.startTime;
      if (uptime < 0) {
        return {
          status: 'fail',
          message: 'Invalid start time',
        };
      }

      // Check memory usage (warn if too high)
      const memUsage = process.memoryUsage();
      const memUsageMB = memUsage.heapUsed / 1024 / 1024;
      const memLimitMB = 512; // Warn if over 512MB

      if (memUsageMB > memLimitMB) {
        return {
          status: 'warn',
          message: `High memory usage: ${memUsageMB.toFixed(2)}MB`,
          details: {
            heapUsed: memUsageMB,
            heapTotal: memUsage.heapTotal / 1024 / 1024,
            rss: memUsage.rss / 1024 / 1024,
          },
        };
      }

      return {
        status: 'pass',
        message: 'Process is alive',
        details: {
          uptime: uptime,
          memoryMB: memUsageMB.toFixed(2),
        },
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Liveness check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Readiness check - can it handle requests?
   */
  async checkReadiness(): Promise<CheckResult> {
    try {
      // Check if service is marked as ready
      if (!this.isReady) {
        return {
          status: 'fail',
          message: 'Service is not ready',
        };
      }

      // Run all registered readiness checks
      const checkResults: Record<string, CheckResult> = {};
      let allPassed = true;

      for (const [name, check] of this.readinessChecks.entries()) {
        try {
          const result = await check();
          checkResults[name] = result;
          if (result.status === 'fail') {
            allPassed = false;
          }
        } catch (error) {
          checkResults[name] = {
            status: 'fail',
            message: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
          };
          allPassed = false;
        }
      }

      if (!allPassed) {
        return {
          status: 'fail',
          message: 'One or more readiness checks failed',
          details: checkResults,
        };
      }

      return {
        status: 'pass',
        message: 'Service is ready',
        details: checkResults,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Readiness check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Startup check - is it still initializing?
   */
  async checkStartup(): Promise<CheckResult> {
    const uptime = Date.now() - this.startTime;
    const isInGracePeriod = uptime < this.startupGracePeriod;

    if (isInGracePeriod) {
      return {
        status: 'warn',
        message: `Service is starting up (${uptime}ms elapsed)`,
        details: {
          uptime,
          gracePeriod: this.startupGracePeriod,
        },
      };
    }

    // After grace period, check if ready
    const readiness = await this.checkReadiness();
    if (readiness.status === 'pass') {
      return {
        status: 'pass',
        message: 'Service has started successfully',
      };
    }

    return {
      status: 'fail',
      message: `Service failed to start within grace period: ${readiness.message}`,
    };
  }

  /**
   * Get overall health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const [liveness, readiness, startup] = await Promise.all([
      this.checkLiveness(),
      this.checkReadiness(),
      this.checkStartup(),
    ]);

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'starting' = 'healthy';
    if (liveness.status === 'fail' || readiness.status === 'fail') {
      overallStatus = 'unhealthy';
    } else if (startup.status === 'warn' || !this.isReady) {
      overallStatus = 'starting';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks: {
        liveness,
        readiness,
        startup,
      },
    };
  }
}

/**
 * Create Express middleware for health checks
 */
export function createHealthCheckMiddleware(healthService: HealthCheckService) {
  return {
    // Liveness probe - Kubernetes will restart if this fails
    liveness: async (req: any, res: any) => {
      const result = await healthService.checkLiveness();
      const statusCode = result.status === 'pass' ? 200 : 503;
      res.status(statusCode).json({
        status: result.status,
        message: result.message,
        details: result.details,
      });
    },

    // Readiness probe - Kubernetes will stop sending traffic if this fails
    readiness: async (req: any, res: any) => {
      const result = await healthService.checkReadiness();
      const statusCode = result.status === 'pass' ? 200 : 503;
      res.status(statusCode).json({
        status: result.status,
        message: result.message,
        details: result.details,
      });
    },

    // Startup probe - Kubernetes will wait before starting readiness checks
    startup: async (req: any, res: any) => {
      const result = await healthService.checkStartup();
      const statusCode = result.status === 'pass' ? 200 : result.status === 'warn' ? 202 : 503;
      res.status(statusCode).json({
        status: result.status,
        message: result.message,
        details: result.details,
      });
    },

    // Combined health check
    health: async (req: any, res: any) => {
      const status = await healthService.getHealthStatus();
      const statusCode = status.status === 'healthy' ? 200 : status.status === 'starting' ? 202 : 503;
      res.status(statusCode).json(status);
    },
  };
}
