// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { createInitialMaze } from "@/entities/maze";
import type { Maze } from "@/entities/maze";
import { COMMAND_BUILDER_OUTCOME_TYPE } from "@/features/command-management";
import type { CameraSession } from "@/shared/camera";
import { UNCATEGORIZED_FOLDER_ID } from "@/shared/config";

import type { ArStageController } from "../model/types";
import type { OpenCameraFn } from "../model/use-camera-stream";
import { ArStage } from "./ar-stage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const noop = (): void => {};

const createMaze = (): Maze => ({
  id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  name: "ArStage テスト迷路",
  folderId: UNCATEGORIZED_FOLDER_ID,
  createdAt: 0,
  updatedAt: 0,
  ...createInitialMaze(5, 1),
});

/** 表示分岐だけを見るため、操作系をすべて noop にした最小 controller。 */
const createController = (overrides: Partial<ArStageController> = {}): ArStageController => ({
  maze: createMaze(),
  status: "idle",
  isEditable: true,
  isRunning: false,
  canRun: false,
  robot: null,
  moveCount: 0,
  robotAction: null,
  visibleFloor: 0,
  setVisibleFloor: noop,
  run: noop,
  pause: noop,
  resume: noop,
  reset: noop,
  closeResult: noop,
  successOpen: false,
  failureOpen: false,
  failureReason: null,
  commands: [],
  selected: { containerPath: [], index: 0 },
  activePath: null,
  readOnly: false,
  selectInsertionPoint: noop,
  deleteCommand: noop,
  deleteDialogOpen: false,
  deleteTargetLabel: null,
  confirmDelete: noop,
  cancelDelete: noop,
  handleQr: noop,
  lastOutcome: null,
  loopDialogOpen: false,
  confirmLoop: noop,
  cancelLoop: noop,
  ...overrides,
});

/**
 * 永遠に解決しないカメラ取得。`camera.status` を "loading" に固定でき、
 * ArScene（R3F Canvas）を描かせずに ArStage を jsdom で検証できる。
 */
const pendingOpenCamera: OpenCameraFn = () => new Promise<CameraSession>(() => {});

describe("ArStage", () => {
  it("カメラ取得中でも削除確認ダイアログを描く（外に置いたパネルからの削除を確定できる）", () => {
    render(
      <ArStage
        controller={createController({ deleteDialogOpen: true, deleteTargetLabel: "前にすすむ" })}
        openCamera={pendingOpenCamera}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("「前にすすむ」を けす？")).toBeTruthy();
    expect(screen.getByRole("button", { name: "けす" })).toBeTruthy();
  });

  it("カメラ取得中でも結果ダイアログとフィードバックトーストを描く", () => {
    render(
      <ArStage
        controller={createController({
          status: "succeeded",
          successOpen: true,
          moveCount: 3,
          lastOutcome: {
            seq: 1,
            outcome: {
              type: COMMAND_BUILDER_OUTCOME_TYPE.COMMAND_DELETED,
              deletedPath: [0],
              nextInsertionPoint: { containerPath: [], index: 0 },
            },
          },
        })}
        openCamera={pendingOpenCamera}
      />,
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("ゴールできた！")).toBeTruthy();
    expect(screen.getByText("めいれいを けしたよ")).toBeTruthy();
  });

  it("カメラ取得中はカメラ準備中の表示を出し、ダイアログは閉じたままにする", () => {
    render(<ArStage controller={createController()} openCamera={pendingOpenCamera} />);

    expect(screen.getByText("カメラを じゅんびしているよ…")).toBeTruthy();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
