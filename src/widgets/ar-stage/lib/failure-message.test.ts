import { describe, expect, it } from "vitest";

import { FAILURE_REASON } from "@/features/maze-simulation";
import type { FailureReason } from "@/features/maze-simulation";

import { FAILURE_MESSAGES, getFailureMessage } from "./failure-message";

describe("FAILURE_MESSAGES / getFailureMessage", () => {
  it("すべての失敗理由に空でない文言が定義されている", () => {
    const reasons: FailureReason[] = Object.values(FAILURE_REASON);
    for (const reason of reasons) {
      const message = getFailureMessage(reason);
      expect(message).toBeTypeOf("string");
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("文言テーブルのキーが失敗理由の全値と一致する", () => {
    expect(Object.keys(FAILURE_MESSAGES).toSorted()).toEqual(
      Object.values(FAILURE_REASON).toSorted(),
    );
  });

  it("代表的な理由が児童向け文言に変換される", () => {
    expect(getFailureMessage(FAILURE_REASON.WALL_COLLISION)).toBe("かべに ぶつかっちゃった！");
    expect(getFailureMessage(FAILURE_REASON.HOLE_FALL)).toBe("あなに おちちゃった！");
    expect(getFailureMessage(FAILURE_REASON.GOAL_BEFORE_KEYS)).toBe(
      "カギを ぜんぶ あつめてから ゴールしよう！",
    );
  });
});
