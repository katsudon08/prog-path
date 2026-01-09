"use client"

import { Trash2 } from "lucide-react"
import { Button } from "../../../../src/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../src/shared/ui/dialog"
import { useFolderDelete } from "../model/useFolderDelete"
import { DEFAULT_FOLDER_NAME } from "../../../entities/folder"
import { useToast } from "../../../shared/ui/toast"

/**
 * フォルダ削除確認ダイアログ
 * フォルダ削除の確認と実行を行う
 */
export function DeleteFolderDialog() {
    const { folderToDelete, close, confirmDelete } = useFolderDelete()
    const { addToast } = useToast()
    const isOpen = folderToDelete !== null

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
                        フォルダの削除
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {folderToDelete ? (
                            <>
                                「<span className="text-neon-cyan font-medium">{folderToDelete}</span>」フォルダを削除してもよろしいですか？
                            </>
                        ) : (
                            "このフォルダを削除してもよろしいですか？"
                        )}
                        <br />
                        フォルダ内の迷路は「{DEFAULT_FOLDER_NAME}」に移動されます。
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
