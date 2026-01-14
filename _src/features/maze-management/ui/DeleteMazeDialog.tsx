"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/_src/shared/ui"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/_src/shared/ui"
import { useMazeDelete } from "../model/useMazeDelete"
import { useMazeStore } from "@/_src/entities/maze"
import { useToast } from "@/_src/shared/ui/toast"

/**
 * 迷路削除確認ダイアログ
 * 迷路削除の確認と実行を行う
 */
export function DeleteMazeDialog() {
    const { mazeToDelete, close, confirmDelete } = useMazeDelete()
    const getMazeById = useMazeStore((s) => s.getMazeById)
    const { addToast } = useToast()
    
    const isOpen = mazeToDelete !== null
    const maze = mazeToDelete ? getMazeById(mazeToDelete) : null

    const handleConfirm = () => {
        const result = confirmDelete()
        addToast(result)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md border-red-500/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        迷路の削除
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {maze ? (
                            <>
                                「<span className="text-neon-cyan font-medium">{maze.name}</span>」を削除してもよろしいですか？
                            </>
                        ) : (
                            "この迷路を削除してもよろしいですか？"
                        )}
                        <br />
                        この操作は取り消せません。
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                        variant="ghost"
                        onClick={close}
                        className="hover:bg-neon-blue/10 text-muted-foreground hover:text-neon-blue"
                    >
                        キャンセル
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        className="bg-red-500 hover:bg-red-600 text-white"
                    >
                        削除
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
