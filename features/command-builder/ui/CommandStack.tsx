"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@shared/ui";
import { Card } from "@shared/ui";
import { Input } from "@shared/ui";
import {
    ArrowUp,
    RotateCw,
    RotateCcw,
    Repeat,
    GitBranch,
    Trash2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import type { Command, CommandType } from "@entities/robot";
import type { InsertionPoint } from "../model";


interface CommandStackProps {
    commands: Command[];
    currentIndex: number;
    onRemove: (index: number) => void;
    onRemoveChild?: (parentIndex: number, childIndex: number) => void;
    onUpdateCommand?: (index: number, command: Command) => void;
    insertionPoint?: InsertionPoint;
    onSetInsertionPoint?: (point: InsertionPoint) => void;
    disabled?: boolean;
}

const COMMAND_INFO: {
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

/**
 * コマンドスタック表示コンポーネント
 * コマンドの追加はQRコード経由でのみ行う
 */
export function CommandStack({
    commands,
    currentIndex,
    onRemove,
    onRemoveChild,
    onUpdateCommand,
    insertionPoint,
    onSetInsertionPoint,
    disabled,
}: CommandStackProps) {
    const [expandedCommands, setExpandedCommands] = useState<Set<number>>(
        new Set()
    );

    // ループ回数編集中の一時的な文字列を保持
    const [editingLoopCounts, setEditingLoopCounts] = useState<Record<number, string>>({});

    // 自動スクロール用のref配列
    const commandRefs = useRef<(HTMLDivElement | null)[]>([]);

    // コマンドリストコンテナのref
    const listContainerRef = useRef<HTMLDivElement | null>(null);

    // currentIndexが変更されたら、該当コマンドへ自動スクロール
    useEffect(() => {
        if (currentIndex >= 0 && currentIndex < commands.length) {
            const element = commandRefs.current[currentIndex];
            const container = listContainerRef.current;
            if (element && container) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                const scrollPosition = container.scrollTop + (elementRect.top - containerRect.top);
                container.scrollTo({
                    behavior: 'smooth',
                    top: scrollPosition,
                });
            }
        }
    }, [currentIndex, commands.length]);

    const getCommandInfo = (command: Command) => {
        const info = COMMAND_INFO.find((btn) => btn.type === command.type);
        return info || COMMAND_INFO[0];
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

    const handleRemoveChildCommand = (
        parentIndex: number,
        childIndex: number
    ) => {
        onRemoveChild?.(parentIndex, childIndex);
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
            <div className="space-y-2 h-72 overflow-y-auto p-2 border border-neon-blue/20 rounded-lg" ref={listContainerRef}>
                {commands.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neon-blue/30 p-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            QRコードをカメラにかざしてコマンドを追加
                        </p>
                    </div>
                ) : (
                    commands.map((command, index) => {
                        const info = getCommandInfo(command);
                        const isActive = index === currentIndex;
                        const isExpanded = expandedCommands.has(index);
                        const hasChildren = command.type === "loop";

                        return (
                            <div key={index} className="space-y-1" ref={(el) => { commandRefs.current[index] = el; }}>
                                <div
                                    className={`flex items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                                        isActive
                                            ? "border-neon-cyan bg-neon-cyan/20 shadow-lg shadow-neon-cyan/20"
                                            : "border-neon-blue/30 bg-space-blue/20"
                                    }`}
                                >
                                    {hasChildren && (
                                        <button
                                            onClick={() => toggleExpanded(index)}
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
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={
                                                        editingLoopCounts[index] ?? 
                                                        String(command.loopCount || 2)
                                                    }
                                                    onChange={(
                                                        e: React.ChangeEvent<HTMLInputElement>
                                                    ) => {
                                                        const value = e.target.value;
                                                        if (value === "" || /^[0-9]+$/.test(value)) {
                                                             if (value.length > 3) return;
                                                             setEditingLoopCounts(prev => ({ ...prev, [index]: value }));
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        const stringValue = editingLoopCounts[index];
                                                        if (stringValue === undefined) return; 
                                                        
                                                        let count = Number.parseInt(stringValue);

                                                        if (isNaN(count) || count < 1) {
                                                            count = 1;
                                                        } else if (count > 10) {
                                                            count = 10;
                                                        }
                                                        
                                                        handleUpdateLoopCount(index, count);
                                                        
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

                                {/* 挿入位置選択ボタン */}
                                <button
                                    onClick={() => onSetInsertionPoint?.({ parentIndex: null, childIndex: index + 1 })}
                                    className={`w-full mt-1 py-1 px-2 text-xs rounded border transition-all ${
                                        insertionPoint?.parentIndex === null && insertionPoint?.childIndex === index + 1
                                            ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-medium'
                                            : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                                    }`}
                                    disabled={disabled}
                                >
                                    {insertionPoint?.parentIndex === null && insertionPoint?.childIndex === index + 1
                                        ? '✓ 選択中（次はここに挿入）'
                                        : 'ここを選択'}
                                </button>

                                {/* Nested Commands */}
                                {hasChildren && isExpanded && (
                                    <div className="ml-8 space-y-1 border-l-2 border-neon-purple/30 pl-4">
                                        {/* ループの最初の挿入位置 */}
                                        <button
                                            onClick={() => onSetInsertionPoint?.({ parentIndex: index, childIndex: 0 })}
                                            className={`w-full py-1 px-2 text-xs rounded border transition-all ${
                                                insertionPoint?.parentIndex === index && insertionPoint?.childIndex === 0
                                                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-medium'
                                                    : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                                            }`}
                                            disabled={disabled}
                                        >
                                            {insertionPoint?.parentIndex === index && insertionPoint?.childIndex === 0
                                                ? '✓ 選択中（次はここに挿入）'
                                                : 'ここを選択'}
                                        </button>

                                        {(command.children || []).map(
                                            (child, childIndex) => {
                                                const childInfo = getCommandInfo(child);
                                                return (
                                                    <div key={childIndex} className="space-y-1">
                                                        <div className="flex items-center gap-2 rounded-lg border border-neon-purple/30 bg-space-dark/50 p-2">
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

                                                        {/* 各子コマンドの後の挿入位置 */}
                                                        <button
                                                            onClick={() => onSetInsertionPoint?.({ parentIndex: index, childIndex: childIndex + 1 })}
                                                            className={`w-full py-1 px-2 text-xs rounded border transition-all ${
                                                                insertionPoint?.parentIndex === index && insertionPoint?.childIndex === childIndex + 1
                                                                    ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan font-medium'
                                                                    : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                                                            }`}
                                                            disabled={disabled}
                                                        >
                                                            {insertionPoint?.parentIndex === index && insertionPoint?.childIndex === childIndex + 1
                                                                ? '✓ 選択中（次はここに挿入）'
                                                                : 'ここを選択'}
                                                        </button>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );
}
