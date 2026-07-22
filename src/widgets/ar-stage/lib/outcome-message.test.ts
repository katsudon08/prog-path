import { describe, expect, it } from "vitest";

import { COMMAND_KIND } from "@/entities/command";
import {
  COMMAND_BUILDER_ERROR_CODE,
  COMMAND_BUILDER_IGNORED_REASON,
  COMMAND_BUILDER_OUTCOME_TYPE,
} from "@/features/command-management";
import type { CommandBuilderOutcome } from "@/features/command-management";

import { ERROR_MESSAGES, getOutcomeMessage, IGNORED_MESSAGES } from "./outcome-message";

const POINT = { containerPath: [], index: 0 };

describe("getOutcomeMessage", () => {
  it("command-added は COMMAND_VISUALS の命令名入りで通知する", () => {
    const outcome: CommandBuilderOutcome = {
      type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_ADDED,
      commandKind: COMMAND_KIND.FORWARD,
      nextInsertionPoint: POINT,
    };
    expect(getOutcomeMessage(outcome)).toContain("前にすすむ");
  });

  it("loop-count-pending はダイアログが出るためトーストを出さない（null）", () => {
    const outcome: CommandBuilderOutcome = {
      type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_COUNT_PENDING,
      insertionPoint: POINT,
    };
    expect(getOutcomeMessage(outcome)).toBeNull();
  });

  it("loop-added / loop-closed / cancelled / command-deleted は文言を返す", () => {
    const outcomes: CommandBuilderOutcome[] = [
      { type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_ADDED, loopPath: [0], nextInsertionPoint: POINT },
      {
        type: COMMAND_BUILDER_OUTCOME_TYPE.LOOP_CLOSED,
        closedLoopPath: [0],
        nextInsertionPoint: POINT,
      },
      { type: COMMAND_BUILDER_OUTCOME_TYPE.CANCELLED, nextInsertionPoint: POINT },
      {
        type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED,
        deletedPath: [0],
        nextInsertionPoint: POINT,
      },
    ];
    for (const outcome of outcomes) {
      const message = getOutcomeMessage(outcome);
      expect(message).not.toBeNull();
      expect(message?.length).toBeGreaterThan(0);
    }
  });

  it("ignored は理由別の文言を返す（全理由を網羅）", () => {
    for (const reason of Object.values(COMMAND_BUILDER_IGNORED_REASON)) {
      const outcome: CommandBuilderOutcome = {
        type: COMMAND_BUILDER_OUTCOME_TYPE.IGNORED,
        reason,
      };
      expect(getOutcomeMessage(outcome)).toBe(IGNORED_MESSAGES[reason]);
    }
  });

  it("error はコード別の文言を返す（全コードを網羅）", () => {
    for (const code of Object.values(COMMAND_BUILDER_ERROR_CODE)) {
      const outcome: CommandBuilderOutcome = {
        type: COMMAND_BUILDER_OUTCOME_TYPE.ERROR,
        error: { code, message: "internal" },
      };
      expect(getOutcomeMessage(outcome)).toBe(ERROR_MESSAGES[code]);
    }
  });
});
