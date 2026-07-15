import { describe, expect, it } from "vitest";

import {
  COMMAND_BUILDER_ERROR_CODE,
  COMMAND_BUILDER_IGNORED_REASON,
  COMMAND_BUILDER_OUTCOME_TYPE,
  CommandBuilderErrorCodeSchema,
  CommandBuilderIgnoredReasonSchema,
  CommandBuilderOutcomeTypeSchema,
  CommandPathSchema,
  InsertionPointSchema,
  LoopCountSchema,
} from "./types";

describe("command builder schemas", () => {
  it("outcome typeを定義済みの値だけ受け付ける", () => {
    for (const type of Object.values(COMMAND_BUILDER_OUTCOME_TYPE)) {
      expect(CommandBuilderOutcomeTypeSchema.safeParse(type).success).toBe(true);
    }

    expect(CommandBuilderOutcomeTypeSchema.safeParse("unknown").success).toBe(false);
  });

  it("error codeとignored reasonを定義済みの値だけ受け付ける", () => {
    for (const code of Object.values(COMMAND_BUILDER_ERROR_CODE)) {
      expect(CommandBuilderErrorCodeSchema.safeParse(code).success).toBe(true);
    }
    for (const reason of Object.values(COMMAND_BUILDER_IGNORED_REASON)) {
      expect(CommandBuilderIgnoredReasonSchema.safeParse(reason).success).toBe(true);
    }

    expect(CommandBuilderErrorCodeSchema.safeParse("unknown").success).toBe(false);
    expect(CommandBuilderIgnoredReasonSchema.safeParse("unknown").success).toBe(false);
  });

  it("command pathは0以上の整数配列として検証する", () => {
    expect(CommandPathSchema.safeParse([]).success).toBe(true);
    expect(CommandPathSchema.safeParse([1, 0]).success).toBe(true);
    expect(CommandPathSchema.safeParse([-1]).success).toBe(false);
    expect(CommandPathSchema.safeParse([1.5]).success).toBe(false);
    expect(CommandPathSchema.safeParse(["0"]).success).toBe(false);
  });

  it("insertion pointは非負整数のindexとして検証する", () => {
    expect(InsertionPointSchema.safeParse({ containerPath: [1], index: 0 }).success).toBe(true);
    expect(InsertionPointSchema.safeParse({ containerPath: [], index: -1 }).success).toBe(false);
    expect(InsertionPointSchema.safeParse({ containerPath: [1.5], index: 0 }).success).toBe(false);
  });

  it("loop countは設定された範囲の整数として検証する", () => {
    expect(LoopCountSchema.safeParse(2).success).toBe(true);
    expect(LoopCountSchema.safeParse(10).success).toBe(true);
    expect(LoopCountSchema.safeParse(1).success).toBe(false);
    expect(LoopCountSchema.safeParse(11).success).toBe(false);
    expect(LoopCountSchema.safeParse(2.5).success).toBe(false);
  });
});
