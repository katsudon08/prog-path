// domains/maze/grid-editor public API
export { GridEditor } from "./ui/GridEditor"
export { useMazeGridEditor } from "./lib/useMazeGridEditor"
export { 
    validateTeleportPlacement, 
    validateNotTeleportDestination,
    isInvalidDestination 
} from "./lib/tile-validation"
