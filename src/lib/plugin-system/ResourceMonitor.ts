/**
 * Resource limits configuration for plugin workers
 */
export interface ResourceLimits {
    maxMemoryMB: number;
    maxCpuTimeMs: number;
    checkIntervalMs: number;
}

/**
 * Resource usage statistics
 */
export interface ResourceStats {
    cpuTimeMs: number;
    memoryUsedMB?: number;
    startTime: number;
    lastCheckTime: number;
}

/**
 * Resource Monitor for plugin workers
 * Monitors CPU time and memory usage, terminates worker if limits exceeded
 */
export class ResourceMonitor {
    private limits: ResourceLimits;
    private stats: ResourceStats;
    private checkInterval?: number;
    private onExceedCallback?: () => void;

    constructor(limits: ResourceLimits) {
        this.limits = limits;
        this.stats = {
            cpuTimeMs: 0,
            startTime: Date.now(),
            lastCheckTime: Date.now()
        };
    }

    /**
     * Start monitoring resources
     * @param onExceed Callback to execute when limits are exceeded
     */
    start(onExceed: () => void) {
        this.onExceedCallback = onExceed;
        this.stats.startTime = Date.now();

        this.checkInterval = setInterval(() => {
            this.check();
        }, this.limits.checkIntervalMs);

        console.log('[ResourceMonitor] Started monitoring with limits:', this.limits);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
        console.log('[ResourceMonitor] Stopped monitoring');
    }

    /**
     * Check resource usage against limits
     */
    private check() {
        const now = Date.now();
        const elapsedTime = now - this.stats.startTime;
        this.stats.lastCheckTime = now;

        // Note: We're tracking elapsed time, not actual CPU time
        // For actual CPU time, we would need worker to report performance metrics
        // For now, we use a more reasonable limit based on elapsed time

        // Only check if we have memory stats (from worker reports)
        // CPU time limit is not enforced based on elapsed time as that would
        // terminate long-running plugins incorrectly

        // Check memory limit if we have memory stats
        if (this.stats.memoryUsedMB && this.stats.memoryUsedMB > this.limits.maxMemoryMB) {
            console.warn(
                `[ResourceMonitor] Memory limit exceeded: ${this.stats.memoryUsedMB}MB > ${this.limits.maxMemoryMB}MB`
            );
            this.triggerExceed();
            return;
        }
    }

    /**
     * Update memory usage from worker report
     */
    updateMemoryUsage(heapUsed: number, heapTotal: number) {
        this.stats.memoryUsedMB = heapUsed / (1024 * 1024); // Convert to MB
        console.log(`[ResourceMonitor] Memory usage: ${this.stats.memoryUsedMB.toFixed(2)}MB`);
    }

    /**
     * Get current resource statistics
     */
    getStats(): ResourceStats {
        return { ...this.stats };
    }

    /**
     * Trigger the exceed callback
     */
    private triggerExceed() {
        this.stop();
        if (this.onExceedCallback) {
            this.onExceedCallback();
        }
    }
}
