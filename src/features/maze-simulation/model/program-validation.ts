import { COMMAND_KIND, LOOP_COMMAND_KIND, type Command } from "@/entities/command";
import { LOOP_COUNT_MAX, LOOP_COUNT_MIN } from "@/shared/config";

import type { ExecutionPath } from "./types";

interface InvalidProgramIssue {
  readonly path: ExecutionPath;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isLeafCommandKind = (value: unknown): boolean =>
  value === COMMAND_KIND.FORWARD ||
  value === COMMAND_KIND.TURN_RIGHT ||
  value === COMMAND_KIND.TURN_LEFT ||
  value === COMMAND_KIND.IF_HOLE;

const validateCommandList = (
  value: unknown,
  parentPath: ExecutionPath,
): InvalidProgramIssue | null => {
  if (!Array.isArray(value)) return { path: parentPath };

  for (let index = 0; index < value.length; index += 1) {
    const command = value[index];
    const path = [...parentPath, index];
    if (!isRecord(command)) return { path };

    if (command.kind === LOOP_COMMAND_KIND) {
      if (
        typeof command.count !== "number" ||
        !Number.isInteger(command.count) ||
        command.count < LOOP_COUNT_MIN ||
        command.count > LOOP_COUNT_MAX
      ) {
        return { path };
      }

      const childrenIssue = validateCommandList(command.children, path);
      if (childrenIssue !== null) return childrenIssue;
      continue;
    }

    if (!isLeafCommandKind(command.kind)) return { path };
  }

  return null;
};

/** 実行開始時に、外部境界から来たコマンド木の形を検証する。 */
export const validateCommandProgram = (commands: readonly Command[]): InvalidProgramIssue | null =>
  validateCommandList(commands, []);
