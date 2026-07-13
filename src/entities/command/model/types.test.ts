// 同一スライス内なので Public API(index.ts) を介さず相対 import で内部実装を直接テストする。
// 値のエコーではなく不変条件を検証する。
import { describe, expect, it } from "vitest";

import {
  COMMAND_KIND,
  CommandKindSchema,
  isCommandKind,
  isLoopCommand,
  LOOP_COMMAND_KIND,
} from "./types";
import type { Command } from "./types";

const COMMAND_KIND_VALUES = Object.values(COMMAND_KIND);

describe("CommandKind", () => {
  it("識別子に重複がない", () => {
    expect(new Set(COMMAND_KIND_VALUES).size).toBe(COMMAND_KIND_VALUES.length);
  });

  it("isCommandKind は全ての正規識別子を受理する", () => {
    for (const kind of COMMAND_KIND_VALUES) {
      expect(isCommandKind(kind)).toBe(true);
    }
  });

  it("isCommandKind は未知文字列・非文字列を拒否する", () => {
    for (const value of ["loop", "", "Forward", 0, null, undefined, {}]) {
      expect(isCommandKind(value)).toBe(false);
    }
  });

  it("CommandKindSchema は妥当値を通し不正値で throw する", () => {
    expect(CommandKindSchema.parse(COMMAND_KIND.FORWARD)).toBe(COMMAND_KIND.FORWARD);
    expect(() => CommandKindSchema.parse("unknown")).toThrow();
  });
});

describe("isLoopCommand", () => {
  it("loop ノードのみ true を返す", () => {
    const loop: Command = {
      kind: LOOP_COMMAND_KIND,
      count: 2,
      children: [{ kind: COMMAND_KIND.FORWARD }],
    };
    const leaf: Command = { kind: COMMAND_KIND.FORWARD };
    expect(isLoopCommand(loop)).toBe(true);
    expect(isLoopCommand(leaf)).toBe(false);
  });
});
