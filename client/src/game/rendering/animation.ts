export type RenderLoopController = {
    stop: () => void;
}

export function startRenderLoop(
    renderFrame: (timestamp: number) => void,
    onFpsUpdate?: (fps: number) => void
): RenderLoopController {
    let animationFrameId: number | null = null;
    let isRunning = true;
    let frameCount = 0;
    let lastFpsSample = performance.now();

    function loop(timestamp: number): void {
        if (!isRunning) {
            return;
        }

        frameCount += 1;
        renderFrame(timestamp);

        const elapsedSinceSample = timestamp - lastFpsSample;

        if (elapsedSinceSample >= 500) {
            const fps = Math.round((frameCount * 1000) / elapsedSinceSample);
            onFpsUpdate?.(fps);
            frameCount = 0;
            lastFpsSample = timestamp;
        }

        animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);

    return {
        stop: () => {
            isRunning = false;

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }
        },
    };
}
