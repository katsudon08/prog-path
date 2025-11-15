"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ArrowUp,
    RotateCw,
    RotateCcw,
    Repeat,
    GitBranch,
    Trash2,
    Plus,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import type { Command, CommandType } from "@/lib/types";

interface CommandStackProps {
    commands: Command[];
    currentIndex: number;
    onRemove: (index: number) => void;
    onAddCommand: (type: CommandType) => void;
    onUpdateCommand?: (index: number, command: Command) => void;
    disabled?: boolean;
}

const COMMAND_BUTTONS: {
    type: CommandType;
    label: string;
    icon: React.ReactNode;
    color: string;
}[] = [
    {
        type: "forward",
        label: "前進",
        icon: <ArrowUp className="h-5 w-5" />,
        color: "bg-neon-cyan",
    },
    {
        type: "turnRight",
        label: "右回転",
        icon: <RotateCw className="h-5 w-5" />,
        color: "bg-neon-blue",
    },
    {
        type: "turnLeft",
        label: "左回転",
        icon: <RotateCcw className="h-5 w-5" />,
        color: "bg-neon-blue",
    },
    {
        type: "loop",
        label: "ループ",
        icon: <Repeat className="h-5 w-5" />,
        color: "bg-neon-purple",
    },
    {
        type: "ifHole",
        label: "穴判定",
        icon: <GitBranch className="h-5 w-5" />,
        color: "bg-neon-green",
    },
];

export function CommandStack({
    commands,
    currentIndex,
    onRemove,
    onAddCommand,
    onUpdateCommand,
    disabled,
}: CommandStackProps) {
    const [expandedCommands, setExpandedCommands] = useState<Set<number>>(
        new Set()
    );

    // ★ バグ修正: ループ回数編集中の一時的な文字列を保持
    const [editingLoopCounts, setEditingLoopCounts] = useState<Record<number, string>>({});


    const getCommandInfo = (command: Command) => {
        const info = COMMAND_BUTTONS.find((btn) => btn.type === command.type);
        return info || COMMAND_BUTTONS[0];
    };

    const toggleExpanded = (index: number) => {
        const newExpanded = new Set(expandedCommands);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedCommands(newExpanded);
    };

    const handleAddChildCommand = (
        parentIndex: number,
        childType: CommandType
    ) => {
        if (!onUpdateCommand) return;

        const parent = commands[parentIndex];
        const newChild: Command =
            childType === "loop"
                ? { type: childType, loopCount: 2, children: [] }
                : { type: childType };

        const updatedParent = {
            ...parent,
            children: [...(parent.children || []), newChild],
        };

        onUpdateCommand(parentIndex, updatedParent);
    };

    const handleRemoveChildCommand = (
        parentIndex: number,
        childIndex: number
    ) => {
        if (!onUpdateCommand) return;

        const parent = commands[parentIndex];
        const updatedParent = {
            ...parent,
            children: (parent.children || []).filter(
                (_, i) => i !== childIndex
            ),
        };

        onUpdateCommand(parentIndex, updatedParent);
    };

    const handleUpdateLoopCount = (index: number, count: number) => {
        if (!onUpdateCommand) return;

        const command = commands[index];
        if (command.type === "loop") {
            onUpdateCommand(index, {
                ...command,
                loopCount: count,
            });
        }
    };

    return (
        <Card className="border-neon-blue/30 bg-space-dark/50 p-6">
            <h3 className="mb-4 text-lg font-bold text-neon-cyan">
                コマンドスタック
            </h3>

            {/* Command List */}
            <div className="mb-4 space-y-2">
                {commands.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neon-blue/30 p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            コマンドを追加してください
                        </p>
                    </div>
                ) : (
                    commands.map((command, index) => {
                        const info = getCommandInfo(command);
                        const isActive = index === currentIndex;
                        const isExpanded = expandedCommands.has(index);
                        const hasChildren =
                            command.type === "loop";

                        return (
                            <div key={index} className="space-y-1">
                                <div
                                    className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                        isActive
                                            ? "border-neon-cyan bg-neon-cyan/20 shadow-lg shadow-neon-cyan/20"
                                            : "border-neon-blue/30 bg-space-blue/20"
                                    }`}
                                >
                                    {hasChildren && (
                                        <button
                                            onClick={() =>
                                                toggleExpanded(index)
                                            }
                                            className="text-muted-foreground hover:text-foreground"
                                            disabled={disabled}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded ${info.color} text-space-dark`}
                                    >
                                        {info.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">
                                            {info.label}
                                        </p>
                                        {command.type === "loop" && (
                                            <div className="flex items-center gap-2">
                                                {/* ★ バグ修正: value, onChange, onBlur を変更 */}
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={
                                                        // 編集中はローカル state を、そうでなければ親の state を表示
                                                        editingLoopCounts[index] ?? 
                                                        String(command.loopCount || 2)
                                                    }
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) => {
                                                        // ローカルの文字列 state のみ更新
                                                        const value = e.target.value;
                                                        if (value === "" || /^[0-9]+$/.test(value)) {
                                                             if (value.length > 3) return; // 長すぎる入力を無視
                                                             setEditingLoopCounts(prev => ({ ...prev, [index]: value }));
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        // フォーカスが外れたら、値を検証して親の state を更新
                                                        const stringValue = editingLoopCounts[index];
                                                        // 変更がない（一度も onChange が呼ばれていない）場合は何もしない
                                                        if (stringValue === undefined) return; 
                                                        
                                                        let count = Number.parseInt(stringValue); // "" は NaN

                                                        if (isNaN(count) || count < 1) {
                                                            count = 1;
                                                        } else if (count > 10) {
                                                            count = 10;
                                                        }
                                                        
                                                        // 親コンポーネントの state を更新
                                                        handleUpdateLoopCount(index, count);
                                                        
                                                        // ローカルの編集状態をクリア
                                                        setEditingLoopCounts(prev => {
                                                            const newState = { ...prev };
                                                            delete newState[index];
                                                            return newState;
                                                        });
                                                    }}
                                                    className="h-6 w-16 border-neon-blue/30 bg-space-dark text-xs"
                                                    disabled={disabled}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    回
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => onRemove(index)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-neon-red hover:bg-neon-red/10"
                                        disabled={disabled}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Nested Commands */}
                                {hasChildren && isExpanded && (
                                    <div className="ml-8 space-y-1 border-l-2 border-neon-purple/30 pl-4">
                                        {(command.children || []).map(
                                            (child, childIndex) => {
                                                const childInfo =
                                                    getCommandInfo(child);
                                                return (
                                                    <div
                                                        key={childIndex}
                                                        className="flex items-center gap-2 rounded-lg border border-neon-purple/30 bg-space-dark/50 p-2"
                                                    >
                                                        <div
                                                            className={`flex h-6 w-6 items-center justify-center rounded ${childInfo.color} text-space-dark`}
                                                        >
                                                            {childInfo.icon}
                                                        </div>
                                                        <span className="flex-1 text-xs text-foreground">
                                                            {childInfo.label}
                                                        </span>
                                                        <Button
                                                            onClick={() =>
                                                                handleRemoveChildCommand(
                                                                    index,
                                                                    childIndex
                                                                )
                                                            }
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0 text-neon-red hover:bg-neon-red/10"
                                                            disabled={disabled}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                );
                                            }
                                        )}
                                        <Button
                                            onClick={() =>
                                                handleAddChildCommand(
                                                    index,
                                                    "forward"
                                                )
                                            }
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-neon-purple/30 text-xs text-neon-purple hover:bg-neon-purple/10"
                                            disabled={disabled}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            コマンド追加
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Instructions */}
            <div className="mt-4 rounded-lg border border-neon-blue/30 bg-space-blue/20 p-3">
                <h4 className="mb-2 text-xs font-semibold text-neon-cyan">
                    使い方
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• コマンドを追加してロボットを制御</li>
                    <li>• ループで繰り返し実行</li>
                    <li>• 穴判定で床を生成</li>
                </ul>
            </div>
        </Card>
    );
}