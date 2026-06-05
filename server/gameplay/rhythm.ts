import { type BeatTimingInfo, type TimingValidationResult } from '../../shared/types/rhythm.js';
import { RHYTHM_CONFIG } from '../../shared/constants/rhythm.js';

export class RhythmSystem {
    private bpm: number;
    private perfectToleranceMs: number;
    private goodToleranceMs: number;

    constructor(
        bpm = RHYTHM_CONFIG.DEFAULT_BPM,
        perfectToleranceMs = RHYTHM_CONFIG.DEFAULT_TOLERANCE_PERFECT_MS,
        goodToleranceMs = RHYTHM_CONFIG.DEFAULT_TOLERANCE_GOOD_MS
    ) {
        this.bpm = bpm;
        this.perfectToleranceMs = perfectToleranceMs;
        this.goodToleranceMs = goodToleranceMs;
    }

    public getBpm(): number {
        return this.bpm;
    }

    public setBpm(bpm: number): void {
        this.bpm = bpm;
    }

    public getPerfectToleranceMs(): number {
        return this.perfectToleranceMs;
    }

    public getGoodToleranceMs(): number {
        return this.goodToleranceMs;
    }

    public getBeatIntervalMs(): number {
        return (60 / this.bpm) * 1000;
    }

    public getBeatTiming(timestamp: number, startedAt: number): BeatTimingInfo {
        const elapsedMs = Math.max(0, timestamp - startedAt); //how much time has passed since the game started
        const interval = this.getBeatIntervalMs(); //how long each beat lasts in ms

        const beatProgressFull = elapsedMs / interval; //how many beats have passed
        const beatIndex = Math.floor(beatProgressFull); //the index of the current beat (0-based)
        const beatProgress = beatProgressFull - beatIndex;

        const timeSinceLastBeatMs = elapsedMs % interval; //ms since the last beat started
        const timeToNextBeatMs = interval - timeSinceLastBeatMs; //ms until the next beat starts

        let closestBeatIndex: number;
        let offsetFromClosestBeatMs: number;

        if (timeSinceLastBeatMs < timeToNextBeatMs) { //which beat is closer
            closestBeatIndex = beatIndex; //closes beat is the current beat
            offsetFromClosestBeatMs = timeSinceLastBeatMs; //offset is how much time has passed since the closest beat started (positive if after the beat, negative if before)
        } else {
            closestBeatIndex = beatIndex + 1; //closest beat is the next beat
            offsetFromClosestBeatMs = -timeToNextBeatMs; //reverse offset
        }

        const absOffset = Math.abs(offsetFromClosestBeatMs);
        const isPerfectWindow = absOffset <= this.perfectToleranceMs;
        const isGoodWindow = absOffset <= this.goodToleranceMs;

        return {
            beatIndex,
            elapsedMs,
            beatProgress,
            timeSinceLastBeatMs,
            timeToNextBeatMs,
            closestBeatIndex,
            offsetFromClosestBeatMs,
            isPerfectWindow,
            isGoodWindow,
        };
    }


    public validateTiming(timestamp: number, startedAt: number): TimingValidationResult {
        const timing = this.getBeatTiming(timestamp, startedAt);

        if (timing.isPerfectWindow) {
            return {
                isValid: true,
                rating: 'perfect',
                offsetMs: timing.offsetFromClosestBeatMs,
            };
        }

        if (timing.isGoodWindow) {
            return {
                isValid: true,
                rating: 'good',
                offsetMs: timing.offsetFromClosestBeatMs,
            };
        }

        return {
            isValid: false,
            rating: 'miss',
            offsetMs: timing.offsetFromClosestBeatMs,
        };
    }
}

