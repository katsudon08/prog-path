import type { RefObject } from "react";

/** カメラ状態 */
export interface CameraState {
    videoRef: RefObject<HTMLVideoElement | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    isStreamReady: boolean;
    cameraError: string | null;
}
