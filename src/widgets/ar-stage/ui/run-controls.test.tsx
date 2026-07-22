// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RunControls } from "./run-controls";
import type { RunStatus } from "../model/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const noop = (): void => {};

const renderControls = (
  status: RunStatus,
  overrides: Partial<React.ComponentProps<typeof RunControls>> = {},
): void => {
  render(
    <RunControls
      status={status}
      canRun
      onRun={noop}
      onPause={noop}
      onResume={noop}
      onReset={noop}
      {...overrides}
    />,
  );
};

describe("RunControls", () => {
  it("idle では［じっこう］のみ表示し、クリックで onRun を呼ぶ", () => {
    const onRun = vi.fn();
    renderControls("idle", { onRun });

    const run = screen.getByRole("button", { name: "じっこう" });
    expect(screen.queryByRole("button", { name: "リセット" })).toBeNull();
    fireEvent.click(run);
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("idle で canRun=false なら［じっこう］が disabled", () => {
    const onRun = vi.fn();
    renderControls("idle", { canRun: false, onRun });

    const run = screen.getByRole("button", { name: "じっこう" });
    expect(run).toHaveProperty("disabled", true);
    fireEvent.click(run);
    expect(onRun).not.toHaveBeenCalled();
  });

  it("running では［いちじていし］［リセット］を表示し、それぞれのハンドラを呼ぶ", () => {
    const onPause = vi.fn();
    const onReset = vi.fn();
    renderControls("running", { onPause, onReset });

    fireEvent.click(screen.getByRole("button", { name: "いちじていし" }));
    fireEvent.click(screen.getByRole("button", { name: "リセット" }));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "じっこう" })).toBeNull();
  });

  it("paused では［さいかい］［リセット］を表示し、onResume を呼ぶ", () => {
    const onResume = vi.fn();
    renderControls("paused", { onResume });

    fireEvent.click(screen.getByRole("button", { name: "さいかい" }));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "リセット" })).toBeTruthy();
  });

  it.each<RunStatus>(["succeeded", "failed"])("%s では［リセット］のみ表示する", (status) => {
    const onReset = vi.fn();
    renderControls(status, { onReset });

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "リセット" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
