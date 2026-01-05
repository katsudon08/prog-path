import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/shared/ui"
import { Button, Input } from "@/src/shared/ui"

interface LoopDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    loopInputString: string
    onLoopCountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onConfirm: () => void
}

/**
 * ループ回数入力ダイアログ
 * features.md: loop-dialog
 */
export function LoopDialog({
    open,
    onOpenChange,
    loopInputString,
    onLoopCountChange,
    onConfirm,
}: LoopDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-neon-blue/50 bg-space-dark/90 text-foreground backdrop-blur-sm sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">ループ回数を入力</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        type="number"
                        value={loopInputString}
                        onChange={onLoopCountChange}
                        className="border-neon-blue/30 bg-space-blue/20 text-foreground"
                        min="1"
                        max="10"
                        autoFocus
                    />
                </div>
                <DialogFooter>
                    <Button
                        onClick={onConfirm}
                        className="bg-neon-cyan text-space-dark hover:bg-neon-cyan/90"
                    >
                        決定
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
