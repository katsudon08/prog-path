"use client"

import { FolderPlus } from "lucide-react"
import { Button } from "@/_src/shared/ui"
import { Input } from "@/_src/shared/ui"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/_src/shared/ui"
import { useFolderCreate } from "../model/useFolderCreate"
import { useToast } from "@/_src/shared/ui/toast"

/**
 * フォルダ作成ダイアログ
 * フォルダ名を入力し、新しいフォルダを作成する
 */
export function CreateFolderDialog() {
    const { isOpen, folderName, close, setFolderName, create } = useFolderCreate()
    const { addToast } = useToast()

    const handleCreate = () => {
        const result = create()
        addToast(result)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleCreate()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md border-neon-green/30 bg-space-dark">
                <DialogHeader>
                    <DialogTitle className="text-neon-cyan">
                        新しいフォルダを作成
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 p-4">
                    <Input
                        placeholder="フォルダ名を入力"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-space-darker border-neon-blue/50 text-white"
                        autoFocus
                    />
                    <Button
                        onClick={handleCreate}
                        className="bg-neon-green text-space-dark hover:bg-neon-green/80"
                    >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        作成
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
