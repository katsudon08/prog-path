import { describe, expect, it } from "vitest";

import { toRunStatus } from "./run-status";

describe("toRunStatus", () => {
  it("編集系のマシン状態（idle / building / resetting）を idle に写像する", () => {
    expect(toRunStatus("idle", false)).toBe("idle");
    expect(toRunStatus("building", false)).toBe("idle");
    expect(toRunStatus("resetting", false)).toBe("idle");
  });

  it("running は pause フラグで running / paused を切り替える", () => {
    expect(toRunStatus("running", false)).toBe("running");
    expect(toRunStatus("running", true)).toBe("paused");
  });

  it("success / failure を succeeded / failed に写像する", () => {
    expect(toRunStatus("success", false)).toBe("succeeded");
    expect(toRunStatus("failure", false)).toBe("failed");
  });

  it("running 以外では pause フラグを無視する", () => {
    expect(toRunStatus("idle", true)).toBe("idle");
    expect(toRunStatus("success", true)).toBe("succeeded");
    expect(toRunStatus("failure", true)).toBe("failed");
  });

  it("未知の state value は idle 扱いにする", () => {
    expect(toRunStatus("unknown-state", false)).toBe("idle");
  });
});
