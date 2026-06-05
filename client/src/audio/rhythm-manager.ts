import { RhythmSystem } from '../../../server/gameplay/rhythm.js'
import { type BeatTimingInfo } from '../../../shared/types/rhythm.js';

export class RhythmManager {
    private rhythmSystem: RhythmSystem;
    private startedAt: number | null = null;
    private clockOffset: number = 0;
    private latency: number = 0;
    private lastSnapshotTime: number = 0;
    private lastBeatIndex: number = -1;
    private lastBeatProgress: number = 0;

    constructor() {
        this.rhythmSystem = new RhythmSystem();
    }

    start(startedAt: number): void {
        this.startedAt = startedAt;
    }

    stop(): void {
        this.startedAt = null;
        this.lastSnapshotTime = 0;
        this.lastBeatIndex = -1;
        this.lastBeatProgress = 0;
    }

    isStarted(): boolean {
        return this.startedAt !== null;
    }

    getSystem(): RhythmSystem {
        return this.rhythmSystem;
    }

    getClockOffset(): number {
        return this.clockOffset;
    }

    getLatency(): number {
        return this.latency;
    }

    handlePong(clientTime: number, serverTime: number): void {
        const now = Date.now();
        const rtt = now - clientTime; // Round-trip time 
        const latency = rtt / 2;
        const offset = serverTime + latency - now;

        // Keep the offset from the lowest latency sample as it's the most accurate
        if (this.latency === 0 || latency < this.latency) {
            this.latency = latency;
            this.clockOffset = offset;
            console.log(`Clock sync: latency = ${this.latency}ms, offset = ${this.clockOffset}ms`);
        } else {
            // Smoothly adjust offset slightly over time to handle long-term drift
            this.clockOffset = this.clockOffset * 0.9 + offset * 0.1;
        }
    }

    updateBeatSnapshot(beatIndex: number, beatProgress: number, _serverTime: number): void {
        this.lastSnapshotTime = performance.now();
        this.lastBeatIndex = beatIndex;
        this.lastBeatProgress = beatProgress;
    }

    validateCurrentTiming(timestamp?: number) {
        if (this.startedAt === null) {
            return { isValid: false, rating: 'miss' as const, offsetMs: 0 };
        }
        if (timestamp === undefined) {
            const timing = this.getCurrentBeatTiming();
            if (!timing) {
                return { isValid: false, rating: 'miss' as const, offsetMs: 0 };
            }
            if (timing.isPerfectWindow) {
                return { isValid: true, rating: 'perfect' as const, offsetMs: timing.offsetFromClosestBeatMs };
            }
            if (timing.isGoodWindow) {
                return { isValid: true, rating: 'good' as const, offsetMs: timing.offsetFromClosestBeatMs };
            }
            return { isValid: false, rating: 'miss' as const, offsetMs: timing.offsetFromClosestBeatMs };
        }
        return this.rhythmSystem.validateTiming(timestamp, this.startedAt);
    }

    getCurrentBeatTiming(): BeatTimingInfo | null {
        if (this.startedAt === null) {
            return null;
        }
        if (this.lastBeatIndex === -1) {
            const synchronizedTime = Date.now() + this.clockOffset;
            return this.rhythmSystem.getBeatTiming(synchronizedTime, this.startedAt);
        }

        // Calculate time elapsed since the last received server snapshot (high resolution)
        const elapsedMs = performance.now() - this.lastSnapshotTime;
        const interval = this.rhythmSystem.getBeatIntervalMs();

        // Calculate progress added since the snapshot
        const progressDelta = elapsedMs / interval;
        const totalProgress = this.lastBeatProgress + progressDelta;

        const beatIndex = this.lastBeatIndex + Math.floor(totalProgress);
        const beatProgress = totalProgress % 1.0;

        const timeSinceLastBeatMs = beatProgress * interval;
        const timeToNextBeatMs = interval - timeSinceLastBeatMs;

        let closestBeatIndex: number;
        let offsetFromClosestBeatMs: number;

        if (timeSinceLastBeatMs < timeToNextBeatMs) {
            closestBeatIndex = beatIndex;
            offsetFromClosestBeatMs = timeSinceLastBeatMs;
        } else {
            closestBeatIndex = beatIndex + 1;
            offsetFromClosestBeatMs = -timeToNextBeatMs;
        }

        const absOffset = Math.abs(offsetFromClosestBeatMs);
        const isPerfectWindow = absOffset <= this.rhythmSystem.getPerfectToleranceMs();
        const isGoodWindow = absOffset <= this.rhythmSystem.getGoodToleranceMs();

        return {
            beatIndex,
            elapsedMs: (beatIndex + beatProgress) * interval,
            beatProgress,
            timeSinceLastBeatMs,
            timeToNextBeatMs,
            closestBeatIndex,
            offsetFromClosestBeatMs,
            isPerfectWindow,
            isGoodWindow,
        };
    }
}

export const rhythmManager = new RhythmManager();
