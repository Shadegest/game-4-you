export interface BeatTimingInfo {
    beatIndex: number;
    elapsedMs: number;
    beatProgress: number;
    timeSinceLastBeatMs: number;
    timeToNextBeatMs: number;
    closestBeatIndex: number;
    offsetFromClosestBeatMs: number;
    isPerfectWindow: boolean;
    isGoodWindow: boolean;
}

export interface TimingValidationResult {
    isValid: boolean;
    rating: 'perfect' | 'good' | 'miss';
    offsetMs: number;
}

