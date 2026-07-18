import { describe, expect, it } from "vitest";

import {
  commandPathKey,
  isSameInsertionPoint,
  isSamePath,
  isTailInsertionPoint,
} from "./command-path";

describe("isSamePath", () => {
  it("同じ index 列は一致する", () => {
    expect(isSamePath([], [])).toBe(true);
    expect(isSamePath([0, 1, 2], [0, 1, 2])).toBe(true);
  });

  it("長さが違えば不一致", () => {
    expect(isSamePath([0], [0, 0])).toBe(false);
  });

  it("要素が違えば不一致", () => {
    expect(isSamePath([0, 1], [0, 2])).toBe(false);
  });

  it("どちらかが未指定なら不一致", () => {
    expect(isSamePath(undefined, [])).toBe(false);
    expect(isSamePath([0], undefined)).toBe(false);
    expect(isSamePath(undefined, undefined)).toBe(false);
  });
});

describe("commandPathKey", () => {
  it("root（空配列）は root", () => {
    expect(commandPathKey([])).toBe("root");
  });

  it("index 列を / で連結する", () => {
    expect(commandPathKey([0])).toBe("0");
    expect(commandPathKey([0, 1, 2])).toBe("0/1/2");
  });
});

describe("isSameInsertionPoint", () => {
  it("コンテナと index が一致すれば同一", () => {
    expect(
      isSameInsertionPoint({ containerPath: [0], index: 2 }, { containerPath: [0], index: 2 }),
    ).toBe(true);
  });

  it("index が違えば不一致", () => {
    expect(
      isSameInsertionPoint({ containerPath: [], index: 1 }, { containerPath: [], index: 2 }),
    ).toBe(false);
  });

  it("コンテナが違えば不一致", () => {
    expect(
      isSameInsertionPoint({ containerPath: [0], index: 0 }, { containerPath: [1], index: 0 }),
    ).toBe(false);
  });

  it("どちらかが未指定なら不一致", () => {
    expect(isSameInsertionPoint(undefined, { containerPath: [], index: 0 })).toBe(false);
  });
});

describe("isTailInsertionPoint", () => {
  it("index === コンテナ長 なら末尾", () => {
    expect(isTailInsertionPoint({ containerPath: [], index: 2 }, 2)).toBe(true);
    expect(isTailInsertionPoint({ containerPath: [], index: 0 }, 0)).toBe(true);
  });

  it("index < コンテナ長 なら末尾でない", () => {
    expect(isTailInsertionPoint({ containerPath: [], index: 0 }, 2)).toBe(false);
    expect(isTailInsertionPoint({ containerPath: [], index: 1 }, 2)).toBe(false);
  });
});
