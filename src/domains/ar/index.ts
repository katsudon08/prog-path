// Domain: AR Execution
// Aggregates all AR execution features following features.md

// Page
export { ARPage } from "./Page"
export { ARExecutionWidget } from "./ar-execution"

// camera (QR command scanner)
export { useCameraQRScanner } from "./camera"

// command-builder
export { CommandStack, useCommandBuilder } from "./command-builder"

// maze-runner
export { useMazeRunner } from "./maze-runner"

// maze-3d
export { MazeView3DWidget } from "./maze-3d"

// mini-map
export { MinimapViewWidget } from "./mini-map"

// robot-3d
export { MazeMap, RobotModel } from "./robot-3d"

// dialogs
export { SuccessDialog } from "./success-dialog"
export { FailureDialog } from "./failure-dialog"
export { LoopDialog } from "./loop-dialog"
